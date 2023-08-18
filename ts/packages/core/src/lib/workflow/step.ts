import { ProfilingSessionResults, ResourceProfile, WorkflowExecutionDescription } from '../model';
import { InputOutputData } from './data';
import { WorkflowThread } from './thread';

/**
 * Describes a single step in a workflow.
 */
export interface WorkflowStep {

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
     * The results of the profiling of the serverless function that
     * is executed in this step.
     *
     * If no function needs to be executed, this is `null`.
     */
    profilingResults?: ProfilingSessionResults;

    /**
     * The maximum execution time SLO for this step.
     */
    maxExecutionTimeMs?: number;

    /**
     * Executes this step.
     *
     * The output contains the list of successor steps to be executed.
     */
    execute(input: AccumulatedStepInput, resourceProfile: ResourceProfile, executionDescription: WorkflowExecutionDescription): StepOutput;

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
