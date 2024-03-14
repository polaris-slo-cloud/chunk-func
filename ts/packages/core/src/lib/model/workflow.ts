import { ProfilingSessionResults } from './profiling-result';
import { ResourceProfile } from './resource-profile';

/**
 * Used for describing a workflow in JSON or YAML.
 */
export interface WorkflowDescription {

    /**
     * The name of this workflow.
     */
    name: string;

    /**
     * The steps of this workflow.
     */
    steps: WorkflowStepDescription[];

    /**
     * The name of the first step.
     */
    startStep: string;

    /**
     * The name of the last step.
     */
    endStep: string;

    /**
     * The list of available profiles.
     */
    availableResourceProfiles: ResourceProfile[]

}

/**
 * Defines the type of workflow step.
 */
export enum WorkflowStepType {
    Function = 'function',
    Fork = 'fork',
    Join = 'join',
    Nop = 'nop',
}

/**
 * Describes a workflow step in JSON or YAML.
 */
export interface WorkflowStepDescription {

    /** The type of step. */
    type: WorkflowStepType;

    /** The unique name of the step. */
    name: string;

    /**
     * The list of successor steps.
     *
     * Some workflow step types may only take a subset of these steps as successors during execution.
     * The last step has no successors.
     */
    successors?: string[];

    /**
     * The maximum execution time SLO for this step.
     */
    maxExecutionTimeMs?: number;

    /**
     * The results from profiling, if this step includes a serverless function.
     *
     * These results can be from exhaustive profiling or from Bayesian Optimization guided profiling.
     *
     * These results are used by the ResourceConfigurationStrategies to choose a resource profile for the current step.
     */
    profilingResults?: ProfilingSessionResults;

    /**
     * The results from exhaustive profiling, if this step includes a serverless function.
     *
     * These results are used during workflow execution to determine the actual time of the step under the current profile.
     * There are three possible relationships between the `exhaustiveProfilingResults` and the `profilingResults` above.
     *
     * 1. `profilingResults` and `exhaustiveProfilingResults` are the same (or `exhaustiveProfilingResults` are not set).
     * 2. `profilingResults` contain fewer profiled inputs than `exhaustiveProfilingResults`.
     * 3. `profilingResults` are Bayesian Optimization guided, so some results are inferred, and `exhaustiveProfilingResults` contains
     *    the results from the exhaustive (real) profiling runs.
     */
    exhaustiveProfilingResults?: ProfilingSessionResults;

}

/**
 * Describes the output of a step;
 */
export interface StepExecutionDescription {

    /** The size of the output in bytes. */
    outputSizeBytes: number;

}

/**
 * Describes one single execution of a workflow including its inputs and outputs.
 */
export interface WorkflowExecutionDescription {

    /**
     * The name of this scenario.
     */
    scenarioName: string;

    /**
     * The size of the workflow input in bytes.
     */
    inputSizeBytes: number;

    /**
     * The max response time SLO of the workflow.
     */
    maxResponseTimeMs: number;

    /**
     * The execution descriptions of the steps of the workflow.
     */
    stepExecutions: Record<string, StepExecutionDescription>;

}
