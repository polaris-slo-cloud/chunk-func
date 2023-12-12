import { DirectedGraph } from 'graphology';
import { WorkflowFunctionStep, WorkflowStep } from './step';
import { ProfilingResult } from '../model';

/**
 * A DAG of a workflow in two forms: using WorkflowSteps and using a graphology graph.
 *
 * Both representations are equal. Some algorithms use the steps, while others use the graphology graph.
 */
export interface WorkflowGraph {

    /**
     * The start of the workflow.
     */
    start: WorkflowStep;

    /**
     * The end of the workflow.
     */
    end: WorkflowStep;

    /**
     * Map of all steps in the workflow, indexed by their names.
     */
    steps: Record<string, WorkflowStep>;

    /**
     * The graphology graph that represents this workflow.
     */
    graph: DirectedGraph<WorkflowNodeAttributes>;

    /**
     * Finds the critical path from the source step to the target step using the specified weight function.
     *
     * The critical path computation assumes that the source step has already executed, i.e., its weight is disregarded
     * and not included in the executionTimeMs of the returned path.
     * The steps of the path include the source node for completeness though.
     */
    findCriticalPath(source: WorkflowStep, target: WorkflowStep, weightFn: GetStepWeightFn): WorkflowPath;

    /**
     * Creates a subgraph starting from the `start` step.
     */
    createSubgraph(start: WorkflowStep): WorkflowGraph;

}

/**
 * Attributes for a node in the graphology graph.
 */
export interface WorkflowNodeAttributes {

    /**
     * The step encapsulated by this node.
     */
    step: WorkflowStep;

}

/**
 * The weight of a WorkflowStep as returned by GetStepWeightFn.
 */
export interface WorkflowStepWeight {

    /**
     * The weight that should be used for computing the critical path.
     */
    weight: number;

    /**
     * The ID of the resource profile that was used to compute the weight.
     */
    resourceProfileId: string;

    /**
     * The ProfilingResult that was used to compute the weight.
     */
    profilingResult: ProfilingResult;

}

/**
 * Function to get the weight of a WorkflowFunctionStep for finding a critical path.
 */
export type GetStepWeightFn = (step: WorkflowFunctionStep) => WorkflowStepWeight;

/**
 * Describes a path between two workflow steps.
 */
export interface WorkflowPath {

    /**
     * The steps of the path, from the source to the target.
     *
     * This includes both, the source and the target.
     */
    steps: WorkflowStep[];

    /**
     * The expected execution time of the path.
     *
     * The execution time of the source node is NOT included.
     */
    executionTimeMs: number;

}
