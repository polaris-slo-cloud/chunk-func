
/**
 * Represents a single serverless function in a workflow.
 */
export interface ServerlessFunction {

    /**
     * The name of this function.
     *
     * This must be unique within a workflow.
     */
    functionName: string;

    /**
     * The SLO that describes the maximum allowed response time (in milliseconds) for this function.
     */
    maxResponseTimeMs: number;

}
