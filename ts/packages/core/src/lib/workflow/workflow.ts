import { ResourceProfile, WorkflowExecutionDescription } from '../model';
import { InputOutputData } from './data';
import { WorkflowState } from './state';
import { AccumulatedStepInput, WorkflowFunctionStep } from './step';
import { WorkflowGraph } from './workflow-graph';

/**
 * A strategy for choosing a resource profile configuration for a particular workflow function step, given the current state and input.
 */
export interface ResourceConfigurationStrategy {

    /** The name of the strategy. */
    readonly name: string;

    /** The graph of the workflow. */
    readonly workflowGraph: WorkflowGraph;

    /**
     * The available resources profiles
     */
    readonly availableResourceProfiles: Record<string, ResourceProfile>

    /**
     * Chooses the resource profile configuration for the specified function step, given the current state and input.
     */
    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile;

}

/** Factory for creating ResourceConfigurationStrategies */
export type ChooseConfigurationStrategyFactory = (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => ResourceConfigurationStrategy;

/**
 * Describes the input for a Workflow.
 */
export interface WorkflowInput<T> {

    /**
     * The input data.
     */
    data: InputOutputData<T>

    /**
     * The execution description for the workflow.
     */
    executionDescription: WorkflowExecutionDescription;

}

/**
 * Describes the output of a Workflow.
 */
export interface WorkflowOutput<T> {

    /**
     * The computed configuration for all serverless functions, identified by their WorkflowStep names.
     */
    config: Record<string, ResourceProfile>;

    /**
     * The total execution time of the workflow;
     */
    executionTimeMs: number;

    /**
     * The total cost of the execution of the workflow.
     */
    totalCost: number;

    /**
     * The output data computed by the workflow.
     */
    data: InputOutputData<T>;

}

/**
 * Represents a serverless workflow as a DAG.
 */
export interface Workflow {

    /**
     * The name of the workflow.
     */
    readonly name: string;

    /**
     * The DAG of this workflow.
     */
    readonly graph: WorkflowGraph;

    /**
     * The available resources profiles
     */
    readonly availableResourceProfiles: Record<string, ResourceProfile>

    /**
     * The maximum execution time SLO in milliseconds.
     */
    maxExecutionTimeMs: number;

    /**
     * Simulates the execution of the workflow using the specified input.
     */
    execute<I, O>(input: WorkflowInput<I>, resourceConfigStrat: ResourceConfigurationStrategy): WorkflowOutput<O>;

}


