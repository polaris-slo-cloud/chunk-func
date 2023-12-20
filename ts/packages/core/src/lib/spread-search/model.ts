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

export function getWorkflowResourceConfigNodeKey(step: WorkflowStep, resourceProfile?: ResourceProfile): string {
    if (resourceProfile) {
        return `${step.name}-${getResourceProfileId(resourceProfile)}`;
    }
    return step.name;
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

}
