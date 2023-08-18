import { DirectedGraph } from 'graphology';
import { WorkflowStep } from './step';

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
