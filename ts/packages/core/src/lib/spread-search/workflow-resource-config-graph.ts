import { MultiDirectedGraph } from 'graphology';
import { WorkflowGraph, WorkflowNodeAttributes } from '../workflow';
import { ResourceProfile } from '../model';

export const START_NODE = 'WorkflowResourceConfigGraph.start';

export interface ResourceConfigEdgeAttributes {

    /**
     * The ResourceProfile that is assigned for the traversal of this edge.
     * If the target is not a function, this is not set.
     */
    resourceProfile?: ResourceProfile;

}

export class WorkflowResourceConfigGraph {

    /**
     * The graphology graph that represents all resource configuration possibilities in the workflow.
     */
    resConfigGraph: MultiDirectedGraph<WorkflowNodeAttributes, ResourceConfigEdgeAttributes>;

    workflowGraph: WorkflowGraph;

    constructor(workflowGraph: WorkflowGraph, resConfigGraph: MultiDirectedGraph<WorkflowNodeAttributes, ResourceConfigEdgeAttributes>) {
        this.workflowGraph = workflowGraph;
        this.resConfigGraph = resConfigGraph;
    }

}
