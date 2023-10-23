import { WorkflowOutput } from '../workflow';

export interface SimulatorOutput {

    /**
     * The name of the scenario used.
     */
    scenarioName: string;

    /**
     * The input data size to the workflow.
     */
    inputDataSizeMib: number;

    /**
     * The SLO used in this scenario.
     */
    sloMs: number;

    /**
     * The name of the resource configuration strategy that was used.
     */
    resourceConfigStrategy: string;

    /**
     * The output produced by the simulation of the scenario using the specified input size.
     */
    workflowOutput: WorkflowOutput<unknown>;

    /**
     * true if the SLO has been fulfilled.
     */
    sloFulfilled: boolean;

    /** Contains the error info if an error occurred. */
    error?: any;

}
