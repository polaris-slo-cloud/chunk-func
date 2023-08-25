import { Heap } from 'heap-js';
import {
    PreconfiguredConfigStrategy,
    ResourceProfile,
    Workflow,
    WorkflowExecutionDescription,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowInput,
    WorkflowStep,
    WorkflowStepType,
    getResourceProfileId,
    getResultsForInput,
} from '@chunk-func/core';
import { SlamFunctionInfo, slamFunctionInfoMaxHeapComparator } from './slam-function-info';

interface SlamState {
    funcHeap: Heap<SlamFunctionInfo>;
    funcSteps: SlamFunctionInfo[];
    stepInputSizes: Record<string, number>;
    maxExecutionTimeMs: number;
    workflowInput: WorkflowInput<any>;
}

export class ConfigFinder {

    private workflow: Workflow;
    private availableProfiles: ResourceProfile[];

    constructor(workflow: Workflow) {
        this.workflow = workflow;
        this.availableProfiles = this.getResourceProfiles(workflow);
    }

    /**
     * Finds a config optimized for the specified SLO using the input sizes defined in the workflowInput (these input sizes
     * should be the medians of the possible inputs, as normally used by SLAM).
     *
     * @returns The resource profile configurations determined for each step.
     */
    optimizeForSlo(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): Record<string, ResourceProfile> {
        const stepInputSizes = this.computeStepInputSizes(workflowInput);
        const state = this.initSlamState(maxExecutionTimeMs, workflowInput);

        do {
            if (this.checkSlo(state)) {
                return this.buildWorkflowConfig(state.funcSteps);
            }

            const longestFunc = state.funcHeap.pop();
            if (longestFunc.selectedProfileIndex < longestFunc.step.profilingResults.results.length - 1) {
                longestFunc.selectedProfileIndex++;
                longestFunc.executionTimeWithProfile = this.getExecutionTimeForProfile(
                    longestFunc.step,
                    stepInputSizes[longestFunc.step.name],
                    this.availableProfiles[longestFunc.selectedProfileIndex],
                );
                state.funcHeap.add(longestFunc);
            }
        } while (!state.funcHeap.isEmpty());

        throw new Error(`There is no configuration that satisfies the SLO of ${maxExecutionTimeMs}`);
    }

    private getResourceProfiles(workflow: Workflow): ResourceProfile[] {
        const profileNames = Object.keys(workflow.availableResourceProfiles);
        const profiles = profileNames.map(name => workflow.availableResourceProfiles[name]);
        return profiles.sort((a, b) => a.memoryMiB - b.memoryMiB);
    }

    private initSlamState(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): SlamState {
        const state: SlamState = {
            stepInputSizes: this.computeStepInputSizes(workflowInput),
            funcSteps: [],
            funcHeap: new Heap(slamFunctionInfoMaxHeapComparator),
            maxExecutionTimeMs,
            workflowInput,
        };
        this.fillHeap(state);
        return state;
    }

    private fillHeap(state: SlamState): void {
        const startProfile = this.availableProfiles[0];
        const graph = this.workflow.graph;

        const stepNames = Object.keys(graph.steps);
        for (const stepName of stepNames) {
            const step = graph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const functionStep = step as WorkflowFunctionStep;
                const slamInfo: SlamFunctionInfo = {
                    step: functionStep,
                    selectedProfileIndex: 0,
                    executionTimeWithProfile: this.getExecutionTimeForProfile(functionStep, state.stepInputSizes[functionStep.name], startProfile),
                };
                state.funcHeap.add(slamInfo);
                state.funcSteps.push(slamInfo);
            }
        }
    }

    private getExecutionTimeForProfile(step: WorkflowFunctionStep, inputSize:number, profile: ResourceProfile): number {
        const profileId = getResourceProfileId(profile);
        for (const result of getResultsForInput(step.profilingResults, inputSize)) {
            if (result.resourceProfileId === profileId) {
                return result.result.executionTimeMs;
            }
        }
    }

    private computeStepInputSizes(workflowInput: WorkflowInput<any>): Record<string, number> {
        const inputSizes: Record<string, number> = {};

        for (const stepName in this.workflow.graph.steps) {
            const step = this.workflow.graph.steps[stepName];
            inputSizes[stepName] = this.computeStepInputSize(step, workflowInput.executionDescription);
        }
        inputSizes[this.workflow.graph.start.name] = workflowInput.data.sizeBytes;

        return inputSizes;
    }

    private computeStepInputSize(step: WorkflowStep, executionDescription: WorkflowExecutionDescription): number {
        if (!step.requiredInputs) {
            return 0;
        }

        let inputSize = 0;
        for (const stepName of step.requiredInputs) {
            const stepExec = executionDescription.stepExecutions[stepName];
            inputSize += stepExec.outputSizeBytes;
        }

        return inputSize;
    }

    private checkSlo(state: SlamState): boolean {
        const stepConfigs = this.buildWorkflowConfig(state.funcSteps);
        const configStrat = new PreconfiguredConfigStrategy(this.workflow.graph, this.workflow.availableResourceProfiles, stepConfigs);
        const output = this.workflow.execute(state.workflowInput, configStrat);
        return output.executionTimeMs <= state.maxExecutionTimeMs;
    }

    private buildWorkflowConfig(funcSteps: SlamFunctionInfo[]): Record<string, ResourceProfile> {
        const configs: Record<string, ResourceProfile> = {};
        for (const funcInfo of funcSteps) {
            configs[funcInfo.step.name] = this.availableProfiles[funcInfo.selectedProfileIndex];
        }
        return configs;
    }

}
