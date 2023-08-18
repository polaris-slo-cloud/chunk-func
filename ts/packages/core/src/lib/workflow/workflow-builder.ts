import { DirectedGraph } from 'graphology';
import { WorkflowDescription } from '../model';
import { Workflow } from './workflow';
import { WorkflowGraph, WorkflowNodeAttributes } from './workflow-graph';
import { WorkflowStep } from './step';
import { WorkflowStepImpl } from './impl/step.impl';
import { WorkflowImpl } from './impl';

export class WorkflowBuilder {

    /**
     * Builds a new workflow from a description.
     */
    buildWorkflow(description: WorkflowDescription): Workflow {
        const steps = this.buildSteps(description);
        const graph = this.buildGraph(description, steps);
        return new WorkflowImpl(description, graph);
    }

    /**
     * Builds an array of workflow steps, but does not set the required inputs yet.
     */
    private buildSteps(description: WorkflowDescription): Record<string, WorkflowStep> {
        const steps: Record<string, WorkflowStep> = {};
        description.steps.forEach(stepDesc => {
            const step = new WorkflowStepImpl(stepDesc);
            steps[step.name] = step;
        });
        return steps;
    }

    private buildGraph(description: WorkflowDescription, steps: Record<string, WorkflowStep>): WorkflowGraph {
        const start = steps[description.startStep];
        const end = steps[description.endStep];
        if (!start || !end) {
            throw new Error('Cannot find start or end step.');
        }

        const graph: WorkflowGraph = {
            start,
            end,
            steps,
            graph: new DirectedGraph<WorkflowNodeAttributes>({ allowSelfLoops: false, multi: false, type: 'directed' }),
        };

        description.steps.forEach(stepDesc => {
            const currStep = steps[stepDesc.name];
            graph.graph.addNode(currStep.name, { step: currStep });

            if (!currStep.possibleSuccessors) {
                return;
            }

            currStep.possibleSuccessors.forEach(successorName => {
                const successorStep = steps[successorName];
                this.addRequiredInput(successorStep, currStep.name);
                graph.graph.addDirectedEdge(currStep.name, successorName);
            });
        });

        return graph;
    }

    private addRequiredInput(step: WorkflowStep, inputStepName: string): void {
        if (!step.requiredInputs) {
            step.requiredInputs = [];
        }
        step.requiredInputs.push(inputStepName);
    }

}
