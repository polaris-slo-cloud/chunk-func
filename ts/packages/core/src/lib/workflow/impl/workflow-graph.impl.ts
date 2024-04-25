import { DirectedGraph } from 'graphology';
import { subgraph } from 'graphology-operators';
import { dijkstra } from 'graphology-shortest-path';
import { bfsFromNode } from 'graphology-traversal';
import { WorkflowDescription, WorkflowStepType } from '../../model';
import { WorkflowFunctionStep, WorkflowStep, WorkflowStepsMap } from '../step';
import { GetStepWeightFn, StepWeightKey, WorkflowGraph, WorkflowNodeAttributes, WorkflowPath } from '../workflow-graph';

export class WorkflowGraphImpl implements WorkflowGraph {

    start: WorkflowStep;
    end: WorkflowStep;
    steps: WorkflowStepsMap;
    graph: DirectedGraph<WorkflowNodeAttributes>;

    constructor(
        steps: WorkflowStepsMap,
        graph: DirectedGraph<WorkflowNodeAttributes>,
        workflowDescription: Pick<WorkflowDescription, 'startStep' | 'endStep'>,
    ) {
        this.steps = steps;
        this.graph = graph;

        const start = steps[workflowDescription.startStep];
        const end = steps[workflowDescription.endStep];
        if (!start || !end) {
            throw new Error('Cannot find start or end step.');
        }
        this.start = start;
        this.end = end;
    }

    findCriticalPath(source: WorkflowStep, target: WorkflowStep, weightFn: GetStepWeightFn, pathWeightKey: StepWeightKey = 'sloWeight'): WorkflowPath {
        const rawPath = dijkstra.bidirectional(
            this.graph,
            source.name,
            target.name,
            (edge: string) => {
                const targetNode = this.graph.getTargetAttributes(edge);
                if (targetNode.step.type === WorkflowStepType.Function) {
                    const weight = weightFn(targetNode.step as WorkflowFunctionStep);
                    return -weight[pathWeightKey];
                }
                return 0;
            },
        );

        if (!rawPath) {
            throw new Error(`There is no path between ${source.name} and ${target.name}`);
        }

        const workflowPath: WorkflowPath = {
            executionTimeMs: 0,
            executionCost: 0,
            steps: new Array(rawPath.length),
        };

        for (let i = 0; i < rawPath.length; ++i) {
            const step = this.steps[rawPath[i]];
            if (i > 0) {
                if (step.type === WorkflowStepType.Function) {
                    const weight = weightFn(step as WorkflowFunctionStep);
                    workflowPath.executionTimeMs += weight.profilingResult.executionTimeMs;
                    workflowPath.executionCost += weight.profilingResult.executionCost;
                }
            }
            workflowPath.steps[i] = step;
        }

        return workflowPath;
    }

    createSubgraph(startStep: WorkflowStep): WorkflowGraph {
        const subgraphSteps = this.getSubgraphSteps(startStep);
        const workflowSubgraph = subgraph(
            this.graph,
            (key) => !!subgraphSteps[key],
        ) as DirectedGraph<WorkflowNodeAttributes>;

        for (const key in subgraphSteps) {
            const step = subgraphSteps[key];
            step.requiredInputs = workflowSubgraph.mapInNeighbors(key, (neighborKey) => neighborKey);
            if (step.requiredInputs.length === 0) {
                step.requiredInputs = undefined;
            }
            workflowSubgraph.setNodeAttribute(key, 'step', step);
        }

        return new WorkflowGraphImpl(subgraphSteps, workflowSubgraph, { startStep: startStep.name, endStep: this.end.name });
    }

    private getSubgraphSteps(startStep: WorkflowStep): WorkflowStepsMap {
        const subgraphSteps: WorkflowStepsMap = {};
        bfsFromNode(
            this.graph,
            startStep.name,
            (key, attributes) => {
                subgraphSteps[key] = attributes.step.clone();
            },
        );
        return subgraphSteps;
    }

}
