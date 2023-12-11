import { Heap } from 'heap-js';
import {
    ProfilingResult,
    ProfilingResultWithProfileId,
    ResourceProfile,
    WorkflowExecutionDescription,
    WorkflowStepType,
    getResourceProfileId,
    getResultsForInput,
} from '../model';
import {
    Workflow,
    WorkflowFunctionStep,
    WorkflowInput,
    WorkflowOutput,
    WorkflowStep,
} from '../workflow';
import { PreconfiguredConfigStrategy } from '../resource-configuration/preconfigured-config-strategy';
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

/**
 * Computes resource configurations for a workflow using SLAM, which was proposed in this paper:
 * G. Safaryan, A. Jindal, M. Chadha, and M. Gerndt, “SLAM: SLO-Aware Memory Optimization for Serverless Applications,”
 * in 2022 IEEE 15th International Conference on Cloud Computing (CLOUD), 2022, pp. 30–39.
 */
export class SlamConfigFinder {

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
        const result = this.optimizeForSloInternal(maxExecutionTimeMs, workflowInput, alwaysReturnToHeap);
        if (!result) {
            throw new Error(`There is no configuration that satisfies the SLO of ${maxExecutionTimeMs}`);
        }
        return result;
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

        if (costOptimizedResult && (!baseResult || costOptimizedResult.workflowOutput.totalCost < baseResult.workflowOutput.totalCost)) {
            // Cost optimized result is cheaper than baseResult or baseResult does not exist (i.e., could not fulfill the SLO).
            return costOptimizedResult;
        } else {
            // Cost optimized result is not cheaper or it does not exist (i.e., could not fulfill the SLO).
            // Ensure that baseResult exists.
            if (baseResult) {
                return baseResult;
            }
        }

        throw new Error(`There is no configuration that satisfies the SLO of ${maxExecutionTimeMs}`);
    }

    /**
     * Optimizes for the specified SLO.
     *
     * @returns the workflowOutput and the stepConfigs on success or `undefined` if no configuration to satisfy the SLO can be found.
     */
    private optimizeForSloInternal(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>, checkReturnToHeap: CheckReturnToHeapFn): SlamOutput | undefined {
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

            const longestFunc = state.funcHeap.pop()!;
            if (longestFunc.selectedProfileIndex < this.availableProfiles.length - 1) {
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

        // There is no configuration that satisfies the SLO.
        return undefined;
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
        const graph = this.workflow.graph;

        for (const stepName in graph.steps) {
            const step = graph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const functionStep = step as WorkflowFunctionStep;
                const baseProfilingResult = this.getProfilingResultForBaseProfile(functionStep, state.stepInputSizes[functionStep.name]);

                const slamInfo: SlamFunctionInfo = {
                    step: functionStep,
                    selectedProfileIndex: this.getProfileIndex(baseProfilingResult.resourceProfileId),
                    profilingResult: baseProfilingResult.result,
                };
                state.funcHeap.add(slamInfo);
                state.funcSteps.push(slamInfo);
            }
        }
    }

    /**
     * Gets the ProfilingResult with the lowest memory configuration for the specified step.
     *
     * Each step may have a different base profile, because some may not work with the lower end resource profiles.
     */
    private getProfilingResultForBaseProfile(step: WorkflowFunctionStep, inputSize: number): ProfilingResultWithProfileId {
        for (const result of getResultsForInput(step.profilingResults, inputSize)) {
            return result;
        }
        throw new Error(`Could not find a successful ProfilingResult for step ${step.name}.`);
    }

    private getProfileIndex(profileId: string): number {
        const index = this.availableProfiles.findIndex(profile => getResourceProfileId(profile) === profileId);
        if (index === -1) {
            throw new Error(`Could not find profile ${profileId} in the list of available profiles`);
        }
        return index;
    }

    private getProfilingResultForProfile(step: WorkflowFunctionStep, inputSize:number, profile: ResourceProfile): ProfilingResult {
        const profileId = getResourceProfileId(profile);
        for (const result of getResultsForInput(step.profilingResults, inputSize)) {
            if (result.resourceProfileId === profileId) {
                return result.result;
            }
        }
        throw new Error(`Could not find a successful ProfilingResult for ${profileId}.`);
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
