import { Heap } from 'heap-js';
import {
    PreconfiguredConfigStrategy,
    ProfilingResult,
    ResourceProfile,
    Workflow,
    WorkflowExecutionDescription,
    WorkflowFunctionStep,
    WorkflowInput,
    WorkflowOutput,
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

export interface SlamOutput {
    /** The resource configurations for each function step. */
    stepConfigs: Record<string, ResourceProfile>;

    /** The output of the workflow. */
    workflowOutput: WorkflowOutput<any>;
}

interface SloCheckResult extends SlamOutput {
    sloFulfilled: boolean;
}

/**
 * Determines if the function should be returned to the heap with the new profile's results.
 */
type CheckReturnToHeapFn = (oldProfileResult: ProfilingResult, newProfileResult: ProfilingResult) => boolean;

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
     * @returns The resource profile configurations determined for each step and the output of the workflow simulation using the specified input.
     */
    optimizeForSlo(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): SlamOutput{
        // In the base version of the algorithm we always return a function to the heap if it hasn't exhausted all available profiles.
        const alwaysReturnToHeap: CheckReturnToHeapFn = () => true;
        return this.optimizeForSloInternal(maxExecutionTimeMs, workflowInput, alwaysReturnToHeap);
    }

    /**
     * Finds a config optimized for the specified SLO and cost using the input sizes defined in the workflowInput (these input sizes
     * should be the medians of the possible inputs, as normally used by SLAM).
     *
     * If no cheaper config than `optimizeForSlo()` can be found, that config is returned.
     *
     * @returns The resource profile configurations determined for each step and the output of the workflow simulation using the specified input.
     */
    optimizeForSloAndCost(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): SlamOutput {
        const baseResult = this.optimizeForSlo(maxExecutionTimeMs, workflowInput);

        const returnToHeapIfCostEfficient: CheckReturnToHeapFn = (oldResult: ProfilingResult, newResult: ProfilingResult) => {
            const costIncrease = (newResult.executionCost - oldResult.executionCost) / oldResult.executionCost;
            const speedIncrease = (oldResult.executionTimeMs - newResult.executionTimeMs) / oldResult.executionTimeMs;
            return costIncrease <= speedIncrease;
        };
        const costOptimizedResult = this.optimizeForSloInternal(maxExecutionTimeMs, workflowInput, returnToHeapIfCostEfficient);

        if (costOptimizedResult.workflowOutput.totalCost < baseResult.workflowOutput.totalCost) {
            console.log(`Returning cost optimized result (${costOptimizedResult.workflowOutput.totalCost}) instead of base result (${baseResult.workflowOutput.totalCost}).`)
            return costOptimizedResult;
        } else {
            console.log(`Returning base result (${baseResult.workflowOutput.totalCost}) instead of cost optimized result (${costOptimizedResult.workflowOutput.totalCost}).`)
            return baseResult;
        }
    }

    private optimizeForSloInternal(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>, checkReturnToHeap: CheckReturnToHeapFn): SlamOutput {
        const stepInputSizes = this.computeStepInputSizes(workflowInput);
        const state = this.initSlamState(maxExecutionTimeMs, workflowInput);

        do {
            const sloCheckResult = this.checkSlo(state);
            if (sloCheckResult.sloFulfilled) {
                return {
                    workflowOutput: sloCheckResult.workflowOutput,
                    stepConfigs: sloCheckResult.stepConfigs,
                };
            }

            const longestFunc = state.funcHeap.pop();
            if (longestFunc.selectedProfileIndex < longestFunc.step.profilingResults.results.length - 1) {
                const oldProfileResult = longestFunc.profilingResult;
                longestFunc.selectedProfileIndex++;
                longestFunc.profilingResult = this.getProfilingResultForProfile(
                    longestFunc.step,
                    stepInputSizes[longestFunc.step.name],
                    this.availableProfiles[longestFunc.selectedProfileIndex],
                );

                if (checkReturnToHeap(oldProfileResult, longestFunc.profilingResult)) {
                    state.funcHeap.add(longestFunc);
                }
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
        const baseProfile = this.availableProfiles[0];
        const graph = this.workflow.graph;

        for (const stepName in graph.steps) {
            const step = graph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const functionStep = step as WorkflowFunctionStep;
                const slamInfo: SlamFunctionInfo = {
                    step: functionStep,
                    selectedProfileIndex: 0,
                    profilingResult: this.getProfilingResultForProfile(functionStep, state.stepInputSizes[functionStep.name], baseProfile),
                };
                state.funcHeap.add(slamInfo);
                state.funcSteps.push(slamInfo);
            }
        }
    }

    private getProfilingResultForProfile(step: WorkflowFunctionStep, inputSize:number, profile: ResourceProfile): ProfilingResult {
        const profileId = getResourceProfileId(profile);
        for (const result of getResultsForInput(step.profilingResults, inputSize)) {
            if (result.resourceProfileId === profileId) {
                return result.result;
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

    private checkSlo(state: SlamState): SloCheckResult {
        const stepConfigs = this.buildWorkflowConfig(state.funcSteps);
        const configStrat = new PreconfiguredConfigStrategy(this.workflow.graph, this.workflow.availableResourceProfiles, stepConfigs);
        const output = this.workflow.execute(state.workflowInput, configStrat);

        return {
            workflowOutput: output,
            stepConfigs,
            sloFulfilled: output.executionTimeMs <= state.maxExecutionTimeMs,
        }
    }

    private buildWorkflowConfig(funcSteps: SlamFunctionInfo[]): Record<string, ResourceProfile> {
        const configs: Record<string, ResourceProfile> = {};
        for (const funcInfo of funcSteps) {
            configs[funcInfo.step.name] = this.availableProfiles[funcInfo.selectedProfileIndex];
        }
        return configs;
    }

}
