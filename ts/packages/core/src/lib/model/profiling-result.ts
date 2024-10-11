import { ResourceProfile, getResourceProfileId } from './resource-profile';

/** Pseudo StatusCode to indicate that the function did not respond before the timeout. */
export const timeoutStatusCode = -1;

/**
 * Describes the deployment status of a function under a specific resource profile.
 */
export enum FunctionDeploymentStatus {
    DeploymentSuccess = 'Success',
    DeploymentFailed = 'Failed',
    DeploymentTimedOut = 'Timeout',
}

/**
 * Describes whether a profiling result is the result of a profiling run or of model inference.
 */
export enum ProfilingResultType {
    ProfilingResultProfiled = 'Profiled',
    ProfilingResultInferred = 'Inferred',
}

/**
 * The execution metrics of a step under a given resource profile or of a workflow path.
 */
export interface ExecutionMetrics {

    /**
     * The time to execute the step or path in milliseconds.
     *
     * For a path the execution time of the source node is NOT included.
     */
    executionTimeMs: number;

    /**
     * The total cost incurred by a single execution of a step or path.
     *
     * For a path the cost of the source node is NOT included.
     *
     * For an entire workflow, all the steps are included.
     */
    executionCost: number;

}

/**
 * The result of a single profiled function execution.
 */
export interface ProfilingResult extends ExecutionMetrics {

    /**
     * The HTTP status code returned by the function execution.
     *
     * If the function is not triggered via REST, this contains the
     * exit code of the function converted into an HTTP status code.
     */
    statusCode: number;

    /**
     * Describes whether the profiling result is the result of
     * a profiling run or of model inference.
     * If this is not set, the result comes from profiling.
     */
    resultType?: ProfilingResultType;

    /**
     * The size of the used input in bytes.
     */
    inputSizeBytes: number;

}

/**
 * Collects all profiling results for a ResourceProfile.
 */
export interface ResourceProfileResults {

    /**
     * The ID of the ResourceProfile that was used for this profiling session.
     */
    resourceProfileId: string;

    /**
     * Indicates if a test function was successfully deployed with this resource profile.
     */
    deploymentStatus: FunctionDeploymentStatus;

    /**
     * The profiling results ordered by increasing input size.
     *
     * Only successful results are contained in this list, i.e., if
     * there was no successful run for a particular input size, this input size
     * is not present in this list.
     *
     * Note 1: This is only present if DeploymentStatus is DeploymentSuccess.
     * Note 2: If none of the profiling runs was successful, this list is empty.
     */
    results?: ProfilingResult[];

    /**
     * The unfiltered profiling results ordered by increasing input size.
     *
     * Unfiltered means that also input sizes with only failed runs are included.
     * This is present for debugging purposes.
     *
     * If DeploymentStatus is not DeploymentSuccess, this is undefined.
     */
    unfilteredResults?: ProfilingResult[];

}

/**
 * A collection of profiling results from a complete profiling session.
 */
export interface ProfilingSessionResults {

    /**
     * The time when the profiling session started.
     */
    profilingStarted: Date | string;

    /**
     * The number of seconds that the profiling session lasted.
     */
    profilingDurationSeconds: number;

    /**
     * The number of ResourceProfile-InputSize combinations (= configurations) that were profiled.
     */
    configurationsProfiled?: number;

    /**
     * The number of ResourceProfile-InputSize combinations (= configurations) that were inferred instead of profiled.
     */
    configurationsInferred?: number;

    /**
     * The number of profiling iterations for each ResourceProfile-InputSize combination.
     */
    iterationsPerInputAndProfile: number;

    /**
     * The list of profiled input sizes in bytes, sorted in ascending order.
     *
     * @TODO Currently, this is determined when building the workflow. I'm not happy about this, because now the
     * interface doesn't match the YAML data structure anymore.
     */
    profiledInputSizes?: number[];

    /**
     * The list of results grouped by ResourceProfiles, ordered by increasing memory size and base cost (per 100ms).
     */
    results: ResourceProfileResults[];

}

/**
 * Helper interface used for iterating over ProfilingSessionResults.
 */
export interface ProfilingResultWithProfileId {

    /**
     * The profiling result.
     */
    result: ProfilingResult;

    /**
     * The ID of the ResourceProfile that was used for this profiling session.
     */
    resourceProfileId: string;
}

/**
 * @returns A negative number if `a < b`, a positive number if `a > b`, or zero if they are equal.
 */
export type ProfilingResultsComparator = (a: ProfilingResultWithProfileId, b: ProfilingResultWithProfileId) => number;

/**
 * Sorts according to `executionTimeMs` in descending order (from slowest to fastest).
 */
export const ProfilingResultsDescExecTimeComparator: ProfilingResultsComparator =
    (a: ProfilingResultWithProfileId, b: ProfilingResultWithProfileId) => b.result.executionTimeMs - a.result.executionTimeMs;

/**
 * Finds the profiling results for the specified resource profile.
 */
export function findResourceProfileResults(profile: ResourceProfile, profilingSessionResults: ProfilingSessionResults): ResourceProfileResults | undefined {
    const profileId = getResourceProfileId(profile);
    return profilingSessionResults.results.find(results => results.resourceProfileId === profileId);
}

/**
 * Finds the `ProfilingResult` for the specified input size within all profiling results of a particular resource profile.
 * If no result that matches the input size and has a success status code can be found, `undefined` is returned.
 *
 * If `inputSizeBytes` is greater than the largest input size, the result for the largest input size is returned, if it was successfully profiled.
 *
 * @param inputSizeBytes The input size for which to find the result.
 * @param profiledInputSizes The list of all profiled input sizes, including those that are not in `profileResults` due to errors.
 * @param profileResults The list of profiling results for a single resource profile. The results must be ordered by increasing input size.
 */
export function findResultForInput(inputSizeBytes: number, profiledInputSizes: number[], profileResults: ProfilingResult[]): ProfilingResult | undefined {
    if (profiledInputSizes.length === 0) {
        return undefined;
    }

    let profilingResult = profileResults.find(result => inputSizeBytes <= result.inputSizeBytes && isSuccessStatusCode(result.statusCode));
    if (!profilingResult) {
        const largestProfiledInputSize = profiledInputSizes[profiledInputSizes.length - 1];
        const largestInputResult = profileResults[profileResults.length - 1];
        if (isSuccessStatusCode(largestInputResult.statusCode) && inputSizeBytes > largestProfiledInputSize && largestInputResult.inputSizeBytes === largestProfiledInputSize) {
            profilingResult = largestInputResult;
        }
    }
    return profilingResult;
}

export function isSuccessStatusCode(statusCode: number): boolean {
    return statusCode >= 200 && statusCode <= 299;
}

/**
 * Allows iterating over the ProfilingResults for a particular input size.
 *
 * The iteration order goes from the profile with the smallest memory size to the one with the largest.
 */
export function* getResultsForInput(profilingSessionResults: ProfilingSessionResults, inputSizeBytes: number): Generator<ProfilingResultWithProfileId> {
    if (!profilingSessionResults.profiledInputSizes) {
        throw new Error('profilingSessionResults.profiledInputSizes is not set.')
    }

    for (const profileResult of profilingSessionResults.results) {
        if (!profileResult.results) {
            throw new Error(`ResourceProfileResults for ${profileResult.resourceProfileId} does not contain any results.`);
        }
        const resultForInput = findResultForInput(inputSizeBytes, profilingSessionResults.profiledInputSizes, profileResult.results);
        if (resultForInput) {
            yield {
                resourceProfileId: profileResult.resourceProfileId,
                result: resultForInput,
            }
        }
    }
}

/**
 * Allows iterating over all ProfilingResults.
 */
export function* getAllResults(profilingSessionResults: ProfilingSessionResults): Generator<ProfilingResultWithProfileId> {
    for (const profileResult of profilingSessionResults.results) {
        if (!profileResult.results) {
            throw new Error(`ResourceProfileResults for ${profileResult.resourceProfileId} does not contain any results.`);
        }

        for (const result of profileResult.results) {
            if (isSuccessStatusCode(result.statusCode)) {
                yield {
                    resourceProfileId: profileResult.resourceProfileId,
                    result: result,
                }
            }
        }
    }
}

/**
 * Gets the `ProfilingResult` for a specific profile and input size.
 */
export function getProfilingResultForProfile(profilingSessionResults: ProfilingSessionResults, inputSize:number, profile: ResourceProfile): ProfilingResult {
    const profileId = getResourceProfileId(profile);
    for (const result of getResultsForInput(profilingSessionResults, inputSize)) {
        if (result.resourceProfileId === profileId) {
            return result.result;
        }
    }
    throw new Error(`Could not find a successful ProfilingResult for ${profileId}.`);
}

/**
 * Gets the profiling results for a specific input size, sorted according to the specified criteria.
 */
export function getResultsForInputSizeSorted(profilingSessionResults: ProfilingSessionResults, inputSize: number, sortBy: ProfilingResultsComparator): ProfilingResultWithProfileId[] {
    const results: ProfilingResultWithProfileId[] = [];
    for (const profilingResult of getResultsForInput(profilingSessionResults, inputSize)) {
        results.push(profilingResult);
    }
    return results.sort(sortBy);
}
