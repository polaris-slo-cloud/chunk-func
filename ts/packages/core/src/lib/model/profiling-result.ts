
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
     *
     * This serves purely informational purposes and is not used by the chunk-func controller.
     */
    executionCost?: string;

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
     * This is only present if DeploymentStatus is DeploymentSuccess.
     */
    results?: ProfilingResult[];

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
     * The list of results grouped by ResourceProfiles, ordered by increasing cost.
     */
    results: ResourceProfileResults[];

}
