import { ResourceProfile, getResourceProfileId } from "./resource-profile";

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
 * Collects the result of a single profiling session.
 */
export interface ProfilingResult {

    /**
     * The HTTP status code returned by the function execution.
     *
     * If the function is not triggered via REST, this contains the
     * exit code of the function converted into an HTTP status code.
     */
    statusCode: number;

    /**
     * The execution time of the function in milliseconds.
     */
    executionTimeMs: number;

    /**
     * The size of the used input in bytes.
     */
    inputSizeBytes: number;

    /**
     * The total cost incurred by a single execution of the function with the used resource profile.
     */
    executionCost: number;

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
 * Finds the profiling results for the specified resource profile.
 */
export function findResourceProfileResults(profile: ResourceProfile, profilingSessionResults: ProfilingSessionResults): ResourceProfileResults | undefined {
    const profileId = getResourceProfileId(profile);
    return profilingSessionResults.results.find(results => results.resourceProfileId === profileId);
}

/**
 * Finds the ProfilingResult for the specified inputSize, assuming the the profileResults are ordered by increasing input size.
 * If no profile with a success status code can be found, `undefined` is returned.
 */
export function findResultForInput(inputSizeBytes: number, profileResults: ProfilingResult[]): ProfilingResult | undefined {
    let profilingResult = profileResults.find(result => inputSizeBytes <= result.inputSizeBytes && isSuccessStatusCode(result.statusCode));
    if (!profilingResult) {
        const largestInputResult = profileResults[profileResults.length - 1];
        if (isSuccessStatusCode(largestInputResult.statusCode)) {
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
    for (const profileResult of profilingSessionResults.results) {
        if (!profileResult.results) {
            throw new Error(`ResourceProfileResults for ${profileResult.resourceProfileId} does not contain any results.`);
        }
        const resultForInput = findResultForInput(inputSizeBytes, profileResult.results);
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
