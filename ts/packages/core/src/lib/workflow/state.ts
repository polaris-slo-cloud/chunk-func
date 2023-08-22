import { Queue } from '../collections/queue';
import { ResourceProfile, WorkflowExecutionDescription } from '../model';
import { StepInput, WorkflowStep } from './step';
import { WorkflowThread } from './thread';

/**
 * Represents the state of a single workflow execution.
 */
export interface WorkflowState {

    /**
     * The currently active threads, indexed by their ID.
     */
    activeThreads: Record<number, WorkflowThread>;

    /**
     * The steps that are queued to be executed next.
     */
    queuedSteps: Queue<WorkflowStep>;

    /**
     * States of the individual WorkflowSteps, indexed by the step names.
     */
    steps: Record<string, StepState>;

    /**
     * The maximum execution time SLO of the workflow in milliseconds.
     */
    maxExecutionTimeMs: number;

    /**
     * The accumulated cost of the workflow steps up to this point.
     */
    totalCost: number;

    /**
     * Description of the scenario that the workflow is executing.
     */
    executionDescription: WorkflowExecutionDescription;

}

/**
 * Represents the state of a single workflow step.
 */
export interface StepState {

    /**
     * The inputs received from predecessor steps and the threads they executed on.
     *
     * A step will always execute on the thread with the lowest ID from its inputs and join the other ones.
     */
    receivedInputs: StepInput[];

    /**
     * The ResourceProfile that was selected for this step's execution, if it comprises a serverless function.
     */
    selectedConfig?: ResourceProfile;

    /**
     * The time the execution of this step took.
     */
    executionTimeMs: number;

    /**
     * The cost incurred by the execution of this step.
     */
    executionCost: number;

}
