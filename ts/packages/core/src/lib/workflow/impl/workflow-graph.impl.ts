import { DirectedGraph } from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import { WorkflowFunctionStep, WorkflowStep } from '../step';
import { GetStepWeightFn, WorkflowGraph, WorkflowNodeAttributes, WorkflowPath } from '../workflow-graph';
import { WorkflowDescription, WorkflowStepType } from '../../model';

export class WorkflowGraphImpl implements WorkflowGraph {

    start: WorkflowStep;
    end: WorkflowStep;
    steps: Record<string, WorkflowStep>;
    graph: DirectedGraph<WorkflowNodeAttributes>;

    constructor(steps: Record<string, WorkflowStep>, graph: DirectedGraph<WorkflowNodeAttributes>, workflowDescription: WorkflowDescription) {
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

    findCriticalPath(source: WorkflowStep, target: WorkflowStep, weightFn: GetStepWeightFn): WorkflowPath {
        const rawPath = dijkstra.bidirectional(
            this.graph,
            source.name,
            target.name,
            (edge: string) => {
                const targetNode = this.graph.getTargetAttributes(edge);
                if (targetNode.step.type === WorkflowStepType.Function) {
                    const weight = weightFn(targetNode.step as WorkflowFunctionStep);
                    return -weight.weight;
                }
                return 0;
            },
        );

        if (!rawPath) {
            throw new Error(`There is no path between ${source.name} and ${target.name}`);
        }

        const workflowPath: WorkflowPath = {
            executionTimeMs: 0,
            steps: new Array(rawPath.length),
        };

        for (let i = 0; i < rawPath.length; ++i) {
            const step = this.steps[rawPath[i]];
            if (i > 0) {
                if (step.type === WorkflowStepType.Function) {
                    const weight = weightFn(step as WorkflowFunctionStep);
                    workflowPath.executionTimeMs += weight.profilingResult.executionTimeMs;
                }
            }
            workflowPath.steps[i] = step;
        }

        return workflowPath;
    }

}
