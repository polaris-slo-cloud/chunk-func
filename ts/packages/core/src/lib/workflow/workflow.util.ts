import { ResourceProfile } from '../model';
import { computeStepInputSize } from './step.util';
import { Workflow, WorkflowInput } from './workflow';
import { WorkflowGraph } from './workflow-graph';

/**
 * Computes the input sizes to all steps of the `WorkflowGraph`, based on the `workflowInput`.
 *
 * @returns A map that associates each step name with its total input size in bytes.
 */
export function computeWorkflowStepsInputSizes(workflowGraph: WorkflowGraph, workflowInput: WorkflowInput<unknown>): Record<string, number> {
    const inputSizes: Record<string, number> = {};

    for (const stepName in workflowGraph.steps) {
        const step = workflowGraph.steps[stepName];
        inputSizes[stepName] = computeStepInputSize(step, workflowInput.executionDescription);
    }
    inputSizes[workflowGraph.start.name] = workflowInput.data.sizeBytes;

    return inputSizes;
}

/**
 * @returns An array of ResourceProfiles sorted by ascending memory.
 */
export function getResourceProfilesSortedByMemory(workflow: Workflow): ResourceProfile[] {
    const profileNames = Object.keys(workflow.availableResourceProfiles);
    const profiles = profileNames.map(name => workflow.availableResourceProfiles[name]);
    return profiles.sort((a, b) => a.memoryMiB - b.memoryMiB);
}
