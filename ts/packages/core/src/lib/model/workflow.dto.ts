
// ToDo
export interface WorkflowDTO {

    /**
     * The name of this workflow.
     */
    name: string;

    /**
     * The SLO that describes the maximum allowed response time (in milliseconds) for the entire workflow.
     */
    maxResponseTimeMs: number;

}
