import { DirectedGraph } from 'graphology';
import { ResourceProfile, WorkflowDescription, WorkflowExecutionDescription, WorkflowStepType, getResourceProfileId } from '../model';
import { Workflow, WorkflowInput } from './workflow';
import { WorkflowGraph, WorkflowNodeAttributes } from './workflow-graph';
import { WorkflowStep } from './step';
import { GenericWorkflowStepImpl, WorkflowFunctionStepImpl } from './impl/step.impl';
import { WorkflowImpl } from './impl';
import { WorkflowGraphImpl } from './impl/workflow-graph.impl';

type StepsAndGraphPair = Pick<WorkflowGraph, 'steps' | 'graph'>

export class WorkflowBuilder {

    /**
     * Builds a new workflow from a description.
     */
    buildWorkflow(description: WorkflowDescription): Workflow {
        const graph = this.buildGraph(description);
        const availableProfiles = this.buildResourceProfilesMap(description);
        return new WorkflowImpl(description, graph, availableProfiles);
    }

    /**
     * Builds an array of workflow steps and the nodes of the graph,
     * but does not set the required inputs or edges yet.
     */
    private buildSteps(description: WorkflowDescription): StepsAndGraphPair {
        const steps: Record<string, WorkflowStep> = {};
        const graph = new DirectedGraph<WorkflowNodeAttributes>({ allowSelfLoops: false, multi: false, type: 'directed' });

        description.steps.forEach(stepDesc => {
            let step: WorkflowStep;
            if (stepDesc.type === WorkflowStepType.Function) {
                step = new WorkflowFunctionStepImpl(stepDesc);
            } else {
                step = new GenericWorkflowStepImpl(stepDesc);
            }

            steps[step.name] = step;
            graph.addNode(step.name, { step });
        });

        return { steps, graph };
    }

    /**
     * Sets the requiredInputs on the steps and creates edges in the graph.
     */
    private connectGraph(description: WorkflowDescription, graph: StepsAndGraphPair): void {
        description.steps.forEach(stepDesc => {
            const currStep = graph.steps[stepDesc.name];
            if (!currStep.possibleSuccessors) {
                return;
            }

            currStep.possibleSuccessors.forEach(successorName => {
                const successorStep = graph.steps[successorName];
                this.addRequiredInput(successorStep, currStep.name);
                graph.graph.addDirectedEdge(currStep.name, successorName);
            });
        });
    }

    private buildGraph(description: WorkflowDescription): WorkflowGraph {
        const stepsAndGraph = this.buildSteps(description);
        this.connectGraph(description, stepsAndGraph);
        return new WorkflowGraphImpl(stepsAndGraph.steps, stepsAndGraph.graph, description);
    }

    private addRequiredInput(step: WorkflowStep, inputStepName: string): void {
        if (!step.requiredInputs) {
            step.requiredInputs = [];
        }
        step.requiredInputs.push(inputStepName);
    }

    private buildResourceProfilesMap(description: WorkflowDescription): Record<string, ResourceProfile> {
        const profiles: Record<string, ResourceProfile> = {};
        description.availableResourceProfiles.forEach(profile => {
            const id = getResourceProfileId(profile);
            profiles[id] = profile;
        });
        return profiles;
    }

}

export function buildWorkflowInput(execDesc: WorkflowExecutionDescription): WorkflowInput<any> {
    return {
        data: {
            sizeBytes: execDesc.inputSizeBytes,
        },
        executionDescription: execDesc,
    };
}
