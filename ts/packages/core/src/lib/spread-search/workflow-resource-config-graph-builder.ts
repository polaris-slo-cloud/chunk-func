import { MultiDirectedGraph } from 'graphology';
import { WorkflowFunctionStep, WorkflowGraph, WorkflowNodeAttributes, WorkflowStep } from '../workflow';
import { ResourceConfigEdgeAttributes, START_NODE, WorkflowResourceConfigGraph } from './workflow-resource-config-graph';
import { ResourceProfile, WorkflowStepType } from '../model';
import { GenericWorkflowStepImpl } from '../workflow/impl/step.impl';

export class WorkflowResourceConfigGraphBuilder {

    buildGraph(workflowGraph: WorkflowGraph, availableResourceProfiles: Record<string, ResourceProfile>): WorkflowResourceConfigGraph {
        const configGraph = new MultiDirectedGraph<WorkflowNodeAttributes, ResourceConfigEdgeAttributes>({ allowSelfLoops: false, multi: true, type: 'directed' });
        configGraph.addNode(START_NODE, { step: this.createStartPseudoStep(workflowGraph.start) });
        this.addNodes(configGraph, workflowGraph);
        this.addEdges(configGraph, workflowGraph, availableResourceProfiles)
        return new WorkflowResourceConfigGraph(workflowGraph, configGraph);
    }

    private createStartPseudoStep(workflowStart: WorkflowStep): WorkflowStep {
        return new GenericWorkflowStepImpl({
            name: START_NODE,
            type: WorkflowStepType.Nop,
            successors: [ workflowStart.name ],
        });
    }

    private addNodes(
        configGraph: MultiDirectedGraph<WorkflowNodeAttributes, ResourceConfigEdgeAttributes>,
        workflowGraph: WorkflowGraph,
    ): void {
        for (const key in workflowGraph.steps) {
            const step = workflowGraph.steps[key];
            configGraph.addNode(key, { step });
        }
    }

    private addEdges(
        configGraph: MultiDirectedGraph<WorkflowNodeAttributes, ResourceConfigEdgeAttributes>,
        workflowGraph: WorkflowGraph,
        availableResourceProfiles: Record<string, ResourceProfile>,
    ): void {
        for (const node of configGraph.nodeEntries()) {
            const srcStep = node.attributes.step;

            if (srcStep.possibleSuccessors) {
                for (const targetKey of srcStep.possibleSuccessors) {
                    const targetStep = workflowGraph.steps[targetKey];
                    this.addResourceProfileEdges(configGraph, srcStep, targetStep, availableResourceProfiles);
                }
            }
        }
    }

    private addResourceProfileEdges(
        configGraph: MultiDirectedGraph<WorkflowNodeAttributes, ResourceConfigEdgeAttributes>,
        srcStep: WorkflowStep,
        targetStep: WorkflowStep,
        availableResourceProfiles: Record<string, ResourceProfile>,
    ): void {
        if (targetStep.type !== WorkflowStepType.Function) {
            configGraph.addDirectedEdge(srcStep.name, targetStep.name, {});
            return;
        }

        const targetFuncStep = targetStep as WorkflowFunctionStep;
        for (const result of targetFuncStep.profilingResults.results) {
            if (result.results) {
                const resourceProfile = availableResourceProfiles[result.resourceProfileId];
                configGraph.addDirectedEdge(srcStep.name, targetFuncStep.name, { resourceProfile });
            }
        }
    }

}
