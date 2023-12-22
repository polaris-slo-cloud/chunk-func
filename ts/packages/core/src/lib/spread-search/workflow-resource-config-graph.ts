import { dijkstra } from 'graphology-shortest-path';
import { ResourceProfile, WorkflowStepType } from '../model';
import { StepWeightKey, WorkflowFunctionStep, WorkflowGraph, WorkflowStep } from '../workflow';
import {
    ConfiguredWorkflowPath,
    END_NODE,
    GetStepWeightWithProfileFn,
    START_NODE,
    FunctionNodeResourceConfigAttributes,
    WorkflowResourceConfigDAG,
    WorkflowStepAndWeight,
    getWorkflowResourceConfigNodeKey,
    getEdgeKey,
} from './model';
import { WorkflowResourceConfigDAGBuilder } from './workflow-resource-config-dag-builder';

/**
 * A DAG that models a workflow using one node for each (`WorkflowFunctionStep`, `ResourceProfile`) pair.
 *
 * For example, if there are three available resource profiles for a function step, there will be three nodes for
 * this function step in the graph, one node for each resource profile.
 * Each node is connected to all nodes that represent its successor steps.
 */
export class WorkflowResourceConfigGraph {

    /**
     * The graphology graph that represents all resource configuration possibilities in the workflow.
     */
    resConfigGraph: WorkflowResourceConfigDAG;

    /** The available resource profiles. */
    availableResourceProfiles: Record<string, ResourceProfile>;

    /** The NOP step that marks the start node of the resConfigGraph. */
    resConfigGraphStart: WorkflowStep;

    /** The NOP step that marks the start node of the resConfigGraph. */
    resConfigGraphEnd: WorkflowStep;

    workflowGraph: WorkflowGraph;

    constructor(workflowGraph: WorkflowGraph, availableResourceProfiles: Record<string, ResourceProfile>) {
        this.workflowGraph = workflowGraph;
        this.availableResourceProfiles = availableResourceProfiles;

        const dagBuilder = new WorkflowResourceConfigDAGBuilder(availableResourceProfiles);
        this.resConfigGraph = dagBuilder.buildGraph(workflowGraph);
        this.resConfigGraphStart = this.resConfigGraph.getNodeAttribute(START_NODE, 'step');
        this.resConfigGraphEnd = this.resConfigGraph.getNodeAttribute(END_NODE, 'step');
    }

    /**
     * Finds the shortest path between the `srcStep` and the end of the workflow using the `weightFn` to determine
     * the weights of the edges.
     * The weight calculation assumes that the `srcStep` has already been executed.
     * This means that the `srcStep` is included in the returned path, but with a weight of zero.
     *
     * Since we assume that the source step has already executed, it is irrelevant which of the
     * source step's resource profile nodes we pick.
     *
     * Currently we only support finding the shortest path to the end of the workflow, because using any
     * other node as the end would require picking a resource profile for it, if it is a function node.
     *
     * @param [pathWeightKey='sloWeight'] The name of the weight property that should be used to compute the path weights.
     * @returns The shortest path or `undefined` if no path exists between `srcStep` and the end node.
     */
    findShortestPathToEnd(srcStep: WorkflowStep, weightFn: GetStepWeightWithProfileFn, pathWeightKey: StepWeightKey = 'sloWeight'): ConfiguredWorkflowPath | undefined {
        const srcNodeKey = this.getSourceNodeKey(srcStep);
        const targetStep = this.resConfigGraphEnd;

        const rawPath = dijkstra.bidirectional(
            this.resConfigGraph,
            srcNodeKey,
            targetStep.name,
            (edgeKey: string) => {
                const targetNode = this.resConfigGraph.getTargetAttributes(edgeKey);
                if (targetNode.resourceProfile) {
                    const stepWeight = weightFn(targetNode as FunctionNodeResourceConfigAttributes);
                    return stepWeight[pathWeightKey];
                }
                return 0;
            },
        );

        if (!rawPath) {
            return undefined;
        }

        return this.convertToConfiguredWorkflowPath(rawPath, weightFn);
    }

    /**
     * Finds and SLO-compliant path from the `srcStep` to the end of the graph using the specified `weightFn`.
     *
     * @returns The SLO-compliant path or `undefined` if no such path exists.
     */
    findSloCompliantPathToEnd(srcStep: WorkflowStep, slo: number, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath | undefined {
        return this.findSloCompliantPathToEndInGraph(this.resConfigGraph, srcStep, slo, weightFn);
    }

    private findSloCompliantPathToEndInGraph(graph: WorkflowResourceConfigDAG, srcStep: WorkflowStep, slo: number, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath | undefined {
        const path = this.findShortestPathToEnd(srcStep, weightFn, 'optimizationWeight');
        if (!path) {
            return undefined;
        }
        if (path.steps.length === 1) {
            return path;
        }

        let sloWeight = 0;
        let currStep: WorkflowStepAndWeight;
        let prevStep = path.steps[0]; // The first step has weight 0, so we don't check it.
        for (let i = 1; i < path.steps.length; ++i, prevStep = currStep) {
            currStep = path.steps[i];
            if (!currStep.weight) {
                continue;
            }
            sloWeight += currStep.weight.sloWeight;
            if (sloWeight > slo) {
                graph = this.removeEdge(graph, prevStep, currStep);
                return this.findSloCompliantPathToEndInGraph(graph, srcStep, slo, weightFn);
            }
        }

        return path;
    }

    /**
     * Removes the edge between the two steps from the graph and returns the modified graph.
     *
     * If `graph === this.resConfigGraph`, a copy is created first.
     */
    private removeEdge(graph: WorkflowResourceConfigDAG, srcStep: WorkflowStepAndWeight, targetStep: WorkflowStepAndWeight): WorkflowResourceConfigDAG {
        if (graph === this.resConfigGraph) {
            graph = this.resConfigGraph.copy() as WorkflowResourceConfigDAG;
        }

        const srcNodeKey = getWorkflowResourceConfigNodeKey(srcStep.step, srcStep.weight?.resourceProfileId);
        const targetNodeKey = getWorkflowResourceConfigNodeKey(targetStep.step, targetStep.weight?.resourceProfileId);
        const edgeKey = getEdgeKey(srcNodeKey, targetNodeKey);
        graph.dropEdge(edgeKey);

        return graph;
    }

    private getSourceNodeKey(step: WorkflowStep): string {
        if (step.type !== WorkflowStepType.Function) {
            return getWorkflowResourceConfigNodeKey(step);
        }

        const funcStep = step as WorkflowFunctionStep;
        for (const result of funcStep.profilingResults.results) {
            if (result.results) {
                return getWorkflowResourceConfigNodeKey(step, this.availableResourceProfiles[result.resourceProfileId]);
            }
        }

        throw new Error(`No successful profiling result found for function step ${step.name}`);
    }

    private convertToConfiguredWorkflowPath(rawPath: dijkstra.BidirectionalDijstraResult, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath {
        const workflowPath: ConfiguredWorkflowPath = {
            executionTimeMs: 0,
            cost: 0,
            steps: new Array(rawPath.length),
        };

        for (let i = 0; i < rawPath.length; ++i) {
            const node = this.resConfigGraph.getNodeAttributes(rawPath[i]);
            const stepAndWeight: WorkflowStepAndWeight = {
                step: node.step,
            };

            if (i > 0 && node.resourceProfile) {
                stepAndWeight.weight = weightFn(node as FunctionNodeResourceConfigAttributes);
                workflowPath.executionTimeMs += stepAndWeight.weight.profilingResult.executionTimeMs;
                workflowPath.cost += stepAndWeight.weight.profilingResult.executionCost;
            }

            workflowPath.steps[i] = stepAndWeight;
        }

        return workflowPath;
    }

}
