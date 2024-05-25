import { DirectedGraph } from 'graphology';
import { WorkflowFunctionStep, WorkflowNodeAttributes, WorkflowStep, WorkflowStepWeight } from '../workflow';
import { ResourceProfile, getResourceProfileId } from '../model';

export type WorkflowResourceConfigDAG = DirectedGraph<WorkflowNodeResourceConfigAttributes>;

export interface WorkflowNodeResourceConfigAttributes extends WorkflowNodeAttributes {

    /**
     * The ResourceProfile that is assigned to this node.
     * If the node is not a function, this is not set.
     */
    resourceProfile?: ResourceProfile;

}

export interface FunctionNodeResourceConfigAttributes extends Required<WorkflowNodeResourceConfigAttributes> {
    step: WorkflowFunctionStep;
}

export const START_NODE = 'WorkflowResourceConfigGraph.start';
export const END_NODE = 'WorkflowResourceConfigGraph.end';

export function getWorkflowResourceConfigNodeKey(step: WorkflowStep, resourceProfile?: ResourceProfile | string): string {
    if (resourceProfile) {
        const resourceProfileId = typeof resourceProfile === 'object' ? getResourceProfileId(resourceProfile) : resourceProfile;
        return `${step.name}-${resourceProfileId}`;
    }
    return step.name;
}

export function getEdgeKey(srcNode: string, targetNode: string) {
    return `${srcNode}->${targetNode}`;
}

export type GetStepWeightWithProfileFn = (stepNode: FunctionNodeResourceConfigAttributes) => WorkflowStepWeight;

export interface WorkflowStepAndWeight {
    step: WorkflowStep;

    /**
     * The weight is set for all function steps, except for the source step (because it does not
     * contribute to the weight of the path).
     */
    weight?: WorkflowStepWeight;
}

/**
 * Represents a workflow path that consists of steps and their corresponding resource configurations.
 */
export interface ConfiguredWorkflowPath {

    /** The steps taken in the path from start to end, with their weights. */
    steps: WorkflowStepAndWeight[];

    /**
     * The expected execution time of the path.
     *
     * The execution time of the source node is NOT included.
     */
    executionTimeMs: number;

    /**
     * The expected cost of the path.
     *
     * The cost of the source node is NOT included.
     */
    cost: number;

    /**
     * The sum of these weights along a path are constrained by the SLO.
     *
     * Example: the `sloWeight` could be the execution time and the `optimizationWeight` could be the cost.
     */
    sloWeight: number;

    /**
     * The sum of these weights should be optimized (typically minimized).
     *
     * This weight needs to be optimized, while the sum of the sloWeights meet the SLO constraint.
     *
     * Example: the `sloWeight` could be the execution time and the `optimizationWeight` could be the cost.
     */
    optimizationWeight: number;

}
