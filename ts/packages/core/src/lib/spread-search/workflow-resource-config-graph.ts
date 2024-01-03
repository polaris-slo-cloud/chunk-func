import { dijkstra } from 'graphology-shortest-path';
import { ResourceProfile } from '../model';
import { StepWeightKey, WorkflowGraph, WorkflowStep } from '../workflow';
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

const TEMP_START_NODE_KEY = 'temp-start';

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

    private dagBuilder: WorkflowResourceConfigDAGBuilder;

    constructor(workflowGraph: WorkflowGraph, availableResourceProfiles: Record<string, ResourceProfile>) {
        this.workflowGraph = workflowGraph;
        this.availableResourceProfiles = availableResourceProfiles;

        this.dagBuilder = new WorkflowResourceConfigDAGBuilder(availableResourceProfiles);
        this.resConfigGraph = this.dagBuilder.buildGraph(workflowGraph);
        this.resConfigGraphStart = this.resConfigGraph.getNodeAttribute(START_NODE, 'step');
        this.resConfigGraphEnd = this.resConfigGraph.getNodeAttribute(END_NODE, 'step');
    }

    /**
     * Finds the shortest path between the `srcStep` and the end of the workflow using the `weightFn` to determine
     * the weights of the edges.
     *
     * This method assumes that the `srcStep` has NOT BEEN EXECUTED yet and still needs to be executed.
     * Thus, it has a weight in the returned path.
     *
     * Currently we only support finding the shortest path to the end of the workflow, because using any
     * other node as the end would require picking a resource profile for it, as if it were a function node.
     *
     * @param [pathWeightKey='sloWeight'] The name of the weight property that should be used to compute the path weights.
     * @returns The shortest path or `undefined` if no path exists between `srcStep` and the end node.
     */
    findShortestPathToEnd(srcStep: WorkflowStep, weightFn: GetStepWeightWithProfileFn, pathWeightKey: StepWeightKey = 'sloWeight'): ConfiguredWorkflowPath | undefined {
        const graphCopy = this.dagBuilder.addTempStartNodeToCopy(this.resConfigGraph, TEMP_START_NODE_KEY, srcStep);
        const path = this.findShortestPathToEndInGraph(graphCopy, TEMP_START_NODE_KEY, weightFn, pathWeightKey);

        if (!path || path.steps.length === 1) {
            return undefined;
        }
        this.trimFirstStepFromWorkflowPath(path);
        return path;
    }

    /**
     * Finds and SLO-compliant path from the `srcStep` to the end of the graph using the specified `weightFn`.
     *
     * This method assumes that the `srcStep` has NOT BEEN EXECUTED yet and still needs to be executed.
     * Thus, it has a weight in the returned path.
     *
     * @returns The SLO-compliant path or `undefined` if no such path exists.
     */
    findSloCompliantPathToEnd(srcStep: WorkflowStep, slo: number, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath | undefined {
        const graphCopy = this.dagBuilder.addTempStartNodeToCopy(this.resConfigGraph, TEMP_START_NODE_KEY, srcStep);
        const path = this.findSloCompliantPathToEndInGraph(graphCopy, TEMP_START_NODE_KEY, slo, weightFn);

        if (!path || path.steps.length === 1) {
            return undefined;
        }
        this.trimFirstStepFromWorkflowPath(path);
        return path;
    }

    /**
     * Finds the shortest path between the srcStep and the end of the workflow in the specified `graph`,
     * using the `weightFn` to determine the weights of the edges.
     *
     * IMPORTANT: This method assumes that the step with `srcStepKey` is a NOP step or that it has already been executed.
     * Thus, the srcStep is included in the returned path with weight 0.
     */
    private findShortestPathToEndInGraph(
        graph: WorkflowResourceConfigDAG,
        srcStepKey: string,
        weightFn: GetStepWeightWithProfileFn,
        pathWeightKey: StepWeightKey = 'sloWeight',
    ): ConfiguredWorkflowPath | undefined {
        const targetStep = this.resConfigGraphEnd;

        const rawPath = dijkstra.bidirectional(
            graph,
            srcStepKey,
            targetStep.name,
            (edgeKey: string) => {
                const targetNode = graph.getTargetAttributes(edgeKey);
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

        return this.convertToConfiguredWorkflowPath(graph, rawPath, weightFn);
    }

    /**
     * Finds and SLO-compliant path from the srcStep to the end of the specified `graph` using the specified `weightFn`.
     *
     * IMPORTANT: This method assumes that the step with `srcStepKey` is a NOP step or that it has already been executed.
     * Thus, the srcStep is included in the returned path with weight 0.
     *
     * @returns The SLO-compliant path or `undefined` if no such path exists.
     */
    private findSloCompliantPathToEndInGraph(graph: WorkflowResourceConfigDAG, srcStepKey: string, slo: number, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath | undefined {
        const path = this.findShortestPathToEndInGraph(graph, srcStepKey, weightFn, 'optimizationWeight');
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
                return this.findSloCompliantPathToEndInGraph(graph, srcStepKey, slo, weightFn);
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
            graph = graph.copy() as WorkflowResourceConfigDAG;
        }

        const srcNodeKey = getWorkflowResourceConfigNodeKey(srcStep.step, srcStep.weight?.resourceProfileId);
        const targetNodeKey = getWorkflowResourceConfigNodeKey(targetStep.step, targetStep.weight?.resourceProfileId);
        const edgeKey = getEdgeKey(srcNodeKey, targetNodeKey);
        graph.dropEdge(edgeKey);

        return graph;
    }

    private convertToConfiguredWorkflowPath(graph: WorkflowResourceConfigDAG, rawPath: dijkstra.BidirectionalDijstraResult, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath {
        const workflowPath: ConfiguredWorkflowPath = {
            executionTimeMs: 0,
            cost: 0,
            sloWeight: 0,
            optimizationWeight: 0,
            steps: new Array(rawPath.length),
        };

        for (let i = 0; i < rawPath.length; ++i) {
            const node = graph.getNodeAttributes(rawPath[i]);
            const stepAndWeight: WorkflowStepAndWeight = {
                step: node.step,
            };

            if (node.resourceProfile) {
                stepAndWeight.weight = weightFn(node as FunctionNodeResourceConfigAttributes);

                // The first step counts as already executed and, thus, does not contribute any weight to the path.
                // We only count the weight for the subsequent steps.
                if (i > 0) {
                    workflowPath.executionTimeMs += stepAndWeight.weight.profilingResult.executionTimeMs;
                    workflowPath.cost += stepAndWeight.weight.profilingResult.executionCost;
                    workflowPath.sloWeight += stepAndWeight.weight.sloWeight;
                    workflowPath.optimizationWeight += stepAndWeight.weight.optimizationWeight;
                } else {
                    stepAndWeight.weight.sloWeight = 0;
                    stepAndWeight.weight.optimizationWeight = 0;
                }
            }

            workflowPath.steps[i] = stepAndWeight;
        }

        return workflowPath;
    }

    private trimFirstStepFromWorkflowPath(path: ConfiguredWorkflowPath): void {
        const firstStep = path.steps[0];
        path.steps = path.steps.slice(1);
        if (firstStep.weight) {
            path.executionTimeMs -= firstStep.weight.profilingResult.executionTimeMs;
            path.cost -= firstStep.weight.profilingResult.executionCost;
            path.sloWeight -= firstStep.weight.sloWeight;
            path.optimizationWeight -= firstStep.weight.optimizationWeight;
        }
    }

}
