import { ProfilingSessionResults, ResourceProfile, WorkflowExecutionDescription, WorkflowStepType } from '../model';
import { InputOutputData } from './data';
import { WorkflowThread } from './thread';

/**
 * Maps the names of WorkflowSteps to the actual objects.
 */
export type WorkflowStepsMap = Record<string, WorkflowStep>;

/**
 * Describes a single step in a workflow.
 */
export interface WorkflowStep {

    /**
     * The type of step.
     */
    readonly type: WorkflowStepType;

    /**
     * The unique name of this step.
     */
    name: string;

    /**
     * The names of the predecessor steps that must provide input for this step,
     * before it can be executed.
     *
     * If no input is required (first step), this is `null`.
     */
    requiredInputs?: string[];

    /**
     * The names of the possible successor steps or `null`, if this is the last step.
     *
     * This list defines all possible successors, if the step implements conditional logic,
     * the list of actual successors may be smaller. To get the actual successor(s), the
     * step must be executed using {@link execute}.
     */
    possibleSuccessors?: string[];

    /**
     * Executes this step.
     *
     * The resourceProfile may only be `undefined` if the step is not of type Function.
     *
     * The output contains the list of successor steps to be executed.
     */
    execute(input: AccumulatedStepInput, resourceProfile: ResourceProfile | undefined, executionDescription: WorkflowExecutionDescription): StepOutput;

    /**
     * Creates a deep clone of this `WorkflowStep`.
     */
    clone(): WorkflowStep;

}

// Normally, there should be an interface and impl class for each WorkflowStep type,
// but since only the function step has a distinct implementation and properties,
// we only define a distinct type for function steps.

/**
 * A workflow step that encapsulates a function.
 */
export interface WorkflowFunctionStep extends WorkflowStep {

    type: WorkflowStepType.Function;

    /**
     * The results of the profiling of the serverless function that
     * is executed in this step.
     *
     * These results can be from exhaustive profiling or from Bayesian Optimization guided profiling.
     *
     * These results are used by the ResourceConfigurationStrategies to choose a resource profile for the current step.
     */
    profilingResults: ProfilingSessionResults;

    /**
     * The results from exhaustive profiling, if this step includes a serverless function.
     *
     * These results are used during workflow execution to determine the actual time of the step under the current profile.
     * There are three possible relationships between the `exhaustiveProfilingResults` and the `profilingResults` above.
     *
     * 1. `profilingResults` and `exhaustiveProfilingResults` are the same.
     * 2. `profilingResults` contain fewer profiled inputs than `exhaustiveProfilingResults`.
     * 3. `profilingResults` are Bayesian Optimization guided, so some results are inferred, and `exhaustiveProfilingResults` contains
     *    the results from the exhaustive (real) profiling runs.
     */
    exhaustiveProfilingResults: ProfilingSessionResults;

    /**
     * The maximum execution time SLO for this step.
     */
    maxExecutionTimeMs?: number;

}

/**
 * Input to a workflow step.
 *
 * This may be expanded later.
 */
export interface StepInput {

    /**
     * The name of the step that this input came from.
     *
     * If this is the first step, this is `undefined`.
     */
    srcStep?: string;

    /**
     * The thread on which this input was received.
     */
    thread: WorkflowThread;

    /**
     * The input data.
     */
    data: InputOutputData;

}

/**
 * Accumulation of all inputs to a step to allow for easy determination of the total data size.
 */
export interface AccumulatedStepInput {

    /**
     * The total size of all input data.
     */
    totalDataSizeBytes: number;

    /**
     * The thread on which this step should execute.
     */
    thread: WorkflowThread;

    /**
     * The individual inputs to this step.
     */
    individualInputs: StepInput[];

}

/**
 * Output of a workflow step.
 *
 * This may be expanded later.
 */
export interface StepOutput {

    /**
     * The list of successor steps that should be executed
     * or `null` if this is the last step in the workflow.
     */
    nextSteps?: string[];

    /**
     * The output data.
     */
    data: InputOutputData;

    /**
     * The time it took to execute the step.
     */
    executionTimeMs: number;

    /**
     * The execution cost of this step.
     */
    cost: number;

}

/**
 * Stores information about the execution of a WorkflowStep.
 */
export interface WorkflowStepExecutionLog {

    /** The ResourceProfile that was used. */
    resourceProfile: ResourceProfile;

    /** The execution time of this step in milliseconds. */
    executionTimeMs: number;

    /**
     * The cost of executing this step.
     */
    executionCost: number;

    /**
     * The number of milliseconds that the resource configuration strategy took to execute.
     */
    resourceConfigStrategyExecutionTimeMs: number;
}
