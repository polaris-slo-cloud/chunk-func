import { dijkstra } from 'graphology-shortest-path';
import { ResourceProfile, WorkflowStepType } from '../model';
import { WorkflowFunctionStep, WorkflowGraph, WorkflowStep } from '../workflow';
import {
    ConfiguredWorkflowPath,
    END_NODE,
    GetStepWeightWithProfileFn,
    START_NODE,
    FunctionNodeResourceConfigAttributes,
    WorkflowResourceConfigDAG,
    WorkflowStepAndWeight,
    getWorkflowResourceConfigNodeKey,
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
     */
    findShortestPathToEnd(srcStep: WorkflowStep, weightFn: GetStepWeightWithProfileFn): ConfiguredWorkflowPath {
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
                    return stepWeight.weight;
                }
                return 0;
            },
        );

        if (!rawPath) {
            throw new Error(`There is no path between ${srcStep.name} and ${targetStep.name}`);
        }

        return this.convertToConfiguredWorkflowPath(rawPath, weightFn);
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
