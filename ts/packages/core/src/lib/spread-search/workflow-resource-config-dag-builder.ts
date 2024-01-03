import { DirectedGraph } from 'graphology';
import { ResourceProfile, WorkflowStepType } from '../model';
import { WorkflowFunctionStep, WorkflowGraph, WorkflowStep } from '../workflow';
import { GenericWorkflowStepImpl } from '../workflow/impl/step.impl';
import { END_NODE, START_NODE, WorkflowNodeResourceConfigAttributes, WorkflowResourceConfigDAG, getEdgeKey, getWorkflowResourceConfigNodeKey } from './model';

/**
 * Builds a `WorkflowResourceConfigGraph` from a `WorkflowGraph`.
 */
export class WorkflowResourceConfigDAGBuilder {

    constructor(private availableResourceProfiles: Record<string, ResourceProfile>) { }

    /**
     * Builds a `WorkflowResourceConfigGraph` from a `WorkflowGraph`.
     */
    buildGraph(workflowGraph: WorkflowGraph): WorkflowResourceConfigDAG {
        const configGraph = new DirectedGraph<WorkflowNodeResourceConfigAttributes>({ allowSelfLoops: false, multi: false, type: 'directed' });
        this.addAllNodes(configGraph, workflowGraph);
        this.addAllEdges(configGraph, workflowGraph)
        return configGraph;
    }

    /**
     * Creates a copy of the `graph`, adds a temporary node with the specified name to it, and creates
     * edges from the temp node to all nodes representing the `targetStep`.
     *
     * @return A copy of `graph` with the temp node added.
     */
    addTempStartNodeToCopy(graph: WorkflowResourceConfigDAG, tempNodeName: string, targetStep: WorkflowStep): WorkflowResourceConfigDAG {
        graph = graph.copy() as WorkflowResourceConfigDAG;

        const tempWorkflowStep = this.createPseudoStep(tempNodeName, [ targetStep.name ]);
        graph.addNode(tempNodeName, { step: tempWorkflowStep });

        this.addEdgesToSuccessorStepNodes(graph, tempNodeName, targetStep);
        return graph;
    }

    private createPseudoStep(name: string, successors?: string[]): WorkflowStep {
        return new GenericWorkflowStepImpl({
            name,
            type: WorkflowStepType.Nop,
            successors,
        });
    }

    private addAllNodes(configGraph: WorkflowResourceConfigDAG, workflowGraph: WorkflowGraph): void {
        this.addNodesForWorkflowStep(configGraph, this.createPseudoStep(START_NODE, [ workflowGraph.start.name ]));

        for (const key in workflowGraph.steps) {
            const step = workflowGraph.steps[key];
            this.addNodesForWorkflowStep(configGraph, step);
        }

        this.addNodesForWorkflowStep(configGraph, this.createPseudoStep(END_NODE));
    }

    private addNodesForWorkflowStep(configGraph: WorkflowResourceConfigDAG, step: WorkflowStep): void {
        if (step.type !== WorkflowStepType.Function) {
            configGraph.addNode(step.name, { step });
            return;
        }

        const funcStep = step as WorkflowFunctionStep;
        this.forEachResourceProfile(funcStep, resourceProfile => {
            const nodeName = getWorkflowResourceConfigNodeKey(funcStep, resourceProfile);
            configGraph.addNode(nodeName, { step, resourceProfile });
        });
    }

    private addAllEdges(configGraph: WorkflowResourceConfigDAG, workflowGraph: WorkflowGraph): void {
        for (const node of configGraph.nodeEntries()) {
            const srcStep = node.attributes.step;

            if (srcStep.possibleSuccessors) {
                for (const targetKey of srcStep.possibleSuccessors) {
                    const targetStep = workflowGraph.steps[targetKey];
                    this.addEdgesToSuccessorStepNodes(configGraph, node.node, targetStep);
                }
            }
        }

        // The end pseudo-node is not listed as a successor, so we need to connect it manually.
        this.addEdgesToPseudoEndNode(configGraph, workflowGraph.end);
    }

    private addEdgesToSuccessorStepNodes(
        configGraph: WorkflowResourceConfigDAG,
        srcNodeKey: string,
        successorStep: WorkflowStep,
    ): void {
        if (successorStep.type !== WorkflowStepType.Function) {
            const targetNodeKey = getWorkflowResourceConfigNodeKey(successorStep);
            const edgeKey = getEdgeKey(srcNodeKey, targetNodeKey);
            configGraph.addDirectedEdgeWithKey(edgeKey, srcNodeKey, targetNodeKey);
            return;
        }

        const successorFuncStep = successorStep as WorkflowFunctionStep;
        this.forEachResourceProfile(successorFuncStep, resourceProfile => {
            const targetNodeKey = getWorkflowResourceConfigNodeKey(successorFuncStep, resourceProfile);
            const edgeKey = getEdgeKey(srcNodeKey, targetNodeKey);
            configGraph.addDirectedEdgeWithKey(edgeKey, srcNodeKey, targetNodeKey);
        });
    }

    private addEdgesToPseudoEndNode(configGraph: WorkflowResourceConfigDAG, workflowEndStep: WorkflowStep): void {
        const endPseudoStep = configGraph.getNodeAttributes(END_NODE).step;

        if (workflowEndStep.type !== WorkflowStepType.Function) {
            const srcNodeKey = getWorkflowResourceConfigNodeKey(workflowEndStep);
            this.addEdgesToSuccessorStepNodes(configGraph, srcNodeKey, endPseudoStep);
            return;
        }

        const funcStep = workflowEndStep as WorkflowFunctionStep;
        this.forEachResourceProfile(funcStep, (resourceProfile) => {
            const srcNodeKey = getWorkflowResourceConfigNodeKey(funcStep, resourceProfile);
            this.addEdgesToSuccessorStepNodes(configGraph, srcNodeKey, endPseudoStep);
        });
    }

    private forEachResourceProfile(step: WorkflowFunctionStep, callback: (resourceProfile: ResourceProfile) => void): void {
        for (const result of step.profilingResults.results) {
            if (result.results) {
                callback(this.availableResourceProfiles[result.resourceProfileId]);
            }
        }
    }

}
