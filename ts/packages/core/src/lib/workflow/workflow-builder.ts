import { DirectedGraph } from 'graphology';
import {
    ProfilingSessionResults,
    ResourceProfile,
    ResourceProfileResults,
    WorkflowDescription,
    WorkflowExecutionDescription,
    WorkflowStepDescription,
    WorkflowStepType,
    getResourceProfileId,
    isSuccessStatusCode,
} from '../model';
import { WorkflowImpl } from './impl';
import { GenericWorkflowStepImpl, WorkflowFunctionStepImpl } from './impl/step.impl';
import { WorkflowGraphImpl } from './impl/workflow-graph.impl';
import { WorkflowStep, WorkflowStepsMap } from './step';
import { Workflow, WorkflowInput } from './workflow';
import { WorkflowGraph, WorkflowNodeAttributes } from './workflow-graph';

type StepsAndGraphPair = Pick<WorkflowGraph, 'steps' | 'graph'>

export class WorkflowBuilder {

    /**
     * Builds a new workflow from a description.
     */
    buildWorkflow(description: WorkflowDescription): Workflow {
        const graph = this.buildGraph(description);
        const availableProfiles = this.buildResourceProfilesMap(description);
        return new WorkflowImpl(description.name, graph, availableProfiles);
    }

    /**
     * Removes empty ResourceProfileResults and throws an error if a ProfilingResult contains a non success status code.
     */
    private pruneAndValidateProfilingResults(stepDesc: WorkflowStepDescription): void {
        if (!stepDesc.profilingResults) {
            return;
        }

        const prunedResProfileResults: ResourceProfileResults[] = [];
        for (const resProfileResults of stepDesc.profilingResults.results) {
            // Do not copy ResourceProfileResults that do not contain any profiling results.
            if (!resProfileResults.results || resProfileResults.results.length === 0) {
                continue;
            }
            for (const result of resProfileResults.results) {
                if (!isSuccessStatusCode(result.statusCode)) {
                    throw new Error(`Profiling results for ${resProfileResults.resourceProfileId} contain statusCode: ${result.statusCode} for input size ${result.inputSizeBytes}`);
                }
            }

            // Now that we know that there are results and that all are valid, we copy the ResourceProfileResults to the pruned list.
            prunedResProfileResults.push(resProfileResults);
        }

        stepDesc.profilingResults.results = prunedResProfileResults;
    }

    private determineProfiledInputSizes(profilingResults: ProfilingSessionResults): number[] {
        const inputSizesSet = new Set<number>();
        for (const resProfileResults of profilingResults.results) {
            if (!resProfileResults.results) {
                continue;
            }
            for (const inputSizeResult of resProfileResults.results) {
                inputSizesSet.add(inputSizeResult.inputSizeBytes);
            }
        }

        const inputSizes = Array.from(inputSizesSet.values());
        inputSizes.sort((a, b) => a - b);
        return inputSizes;
    }

    private prepareProfilingResults(stepDesc: WorkflowStepDescription): void {
        if (stepDesc.profilingResults) {
            this.pruneAndValidateProfilingResults(stepDesc);
            stepDesc.profilingResults.profiledInputSizes = this.determineProfiledInputSizes(stepDesc.profilingResults);

            if (stepDesc.exhaustiveProfilingResults) {
                stepDesc.exhaustiveProfilingResults.profiledInputSizes = stepDesc.profilingResults.profiledInputSizes;
            }
        }
    }

    /**
     * Builds an array of workflow steps and the nodes of the graph,
     * but does not set the required inputs or edges yet.
     */
    private buildSteps(description: WorkflowDescription): StepsAndGraphPair {
        const steps: WorkflowStepsMap = {};
        const graph = new DirectedGraph<WorkflowNodeAttributes>({ allowSelfLoops: false, multi: false, type: 'directed' });

        description.steps.forEach(stepDesc => {
            let step: WorkflowStep;
            if (stepDesc.type === WorkflowStepType.Function) {
                this.prepareProfilingResults(stepDesc);
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
