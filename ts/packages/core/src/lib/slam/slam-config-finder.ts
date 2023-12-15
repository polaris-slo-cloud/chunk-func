import { Heap } from 'heap-js';
import {
    ProfilingResult,
    ProfilingResultWithProfileId,
    ResourceProfile,
    WorkflowStepType,
    getProfilingResultForProfile,
    getResourceProfileId,
    getResultsForInput,
} from '../model';
import {
    Workflow,
    WorkflowFunctionStep,
    WorkflowInput,
    WorkflowOutput,
    computeWorkflowStepsInputSizes,
    getResourceProfilesSortedByMemory,
} from '../workflow';
import { PreconfiguredConfigStrategy } from '../resource-configuration/preconfigured-config-strategy';
import { SlamFunctionInfo, SlamFunctionInfoComparator, slamFuncInfoExecTimeMaxHeapComparator } from './slam-function-info';

/**
 * Allows configuring the `SlamConfigFinder`.
 */
export interface SlamConfigFinderSettings {
    /**
     * The comparator that determines the order of the functions in the heap.
     *
     * Default: `slamFuncInfoExecTimeMaxHeapComparator`
     */
    funcInfoComparator?: SlamFunctionInfoComparator;
}

interface SlamState {
    /**
     * The heap with functions, whose configurations can still be increased.
     *
     * Contrary to the SLAM paper, we check if a function's resource profile can be increased before
     * (re-)inserting the function into the heap. The result is equivalent, but it allows us
     * to use heap comparators that make this assumption.
     */
    funcHeap: Heap<SlamFunctionInfo>;

    /** All function steps with their current configurations. */
    funcSteps: SlamFunctionInfo[];

    /**
     * The input, for which the configurations should be optimized.
     *
     * Typically, this will contain the median input sizes, not the ones from the
     * actual evaluation execution description.
     */
    workflowInput: WorkflowInput<any>;

    /**
     * The input sizes for all function steps, based on the `workflowInput`.
     *
     * Note: This does not automatically make the algorithm input size-aware, because normally the supplied
     * `WorkflowInput` contains the median input sizes and not the sizes from the final execution description
     * used for evaluation.
     */
    stepInputSizes: Record<string, number>;

    /**
     * The SLO in milliseconds.
     */
    maxExecutionTimeMs: number;
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
    private settings: Required<SlamConfigFinderSettings>;

    constructor(workflow: Workflow, settings?: SlamConfigFinderSettings) {
        this.workflow = workflow;
        this.availableProfiles = getResourceProfilesSortedByMemory(workflow);
        this.settings = this.fillSettingsWithDefaults(settings);
    }

    /**
     * Finds a config optimized for the specified SLO using the input sizes defined in the workflowInput (these input sizes
     * should be the medians of the possible inputs, as normally used by SLAM).
     *
     * @param maxExecutionTimeMs The SLO in milliseconds.
     * @param workflowInput The input to the workflow. The input to the first step is `workflowInput.data`.
     * @returns The resource profile configurations determined for each step and the output of the workflow simulation using the specified input
     * or `undefined` if no configuration can be found that fulfills the SLO.
     */
    optimizeForSlo(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): SlamOutput | undefined {
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
     * @param maxExecutionTimeMs The SLO in milliseconds.
     * @param workflowInput The input to the workflow. The input to the first step is `workflowInput.data`.
     * @returns The resource profile configurations determined for each step and the output of the workflow simulation using the specified input
     * or `undefined` if no configuration can be found that fulfills the SLO.
     */
    optimizeForSloAndCost(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): SlamOutput | undefined {
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
            // The baseResult may be undefined (if the SLO cannot be fulfilled by SLAM).
            return baseResult;
        }
    }

    /**
     * Optimizes for the specified SLO.
     *
     * @returns the workflowOutput and the stepConfigs on success or `undefined` if no configuration to satisfy the SLO can be found.
     */
    private optimizeForSloInternal(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>, checkReturnToHeap: CheckReturnToHeapFn): SlamOutput | undefined {
        const state = this.initSlamState(maxExecutionTimeMs, workflowInput);
        const maxProfileIndex = this.availableProfiles.length - 1;

        do {
            const sloCheckResult = this.checkSlo(state);
            if (sloCheckResult.sloFulfilled) {
                return {
                    workflowOutput: sloCheckResult.workflowOutput,
                    stepConfigs: sloCheckResult.stepConfigs,
                };
            }

            const longestFunc = state.funcHeap.pop()!;
            const oldProfileResult = longestFunc.profilingResult;
            // The heap only contains functions, whose profile can still be increased.
            longestFunc.selectedProfileIndex++;
            longestFunc.profilingResult = getProfilingResultForProfile(
                longestFunc.step.profilingResults,
                state.stepInputSizes[longestFunc.step.name],
                this.availableProfiles[longestFunc.selectedProfileIndex],
            );

            if (longestFunc.selectedProfileIndex < maxProfileIndex && checkReturnToHeap(oldProfileResult, longestFunc.profilingResult)) {
                state.funcHeap.add(longestFunc);
            }
        } while (!state.funcHeap.isEmpty());

        // There is no configuration that satisfies the SLO.
        return undefined;
    }

    private initSlamState(maxExecutionTimeMs: number, workflowInput: WorkflowInput<any>): SlamState {
        const state: SlamState = {
            stepInputSizes: computeWorkflowStepsInputSizes(this.workflow.graph, workflowInput),
            funcSteps: [],
            funcHeap: new Heap(this.settings.funcInfoComparator),
            maxExecutionTimeMs,
            workflowInput,
        };
        this.fillHeap(state);
        return state;
    }

    private fillHeap(state: SlamState): void {
        const graph = this.workflow.graph;
        const maxProfileIndex = this.availableProfiles.length - 1;

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
                if (slamInfo.selectedProfileIndex < maxProfileIndex) {
                    state.funcHeap.add(slamInfo);
                }
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

    private fillSettingsWithDefaults(settings?: SlamConfigFinderSettings): Required<SlamConfigFinderSettings> {
        if (!settings) {
            settings = {};
        }
        if (!settings.funcInfoComparator) {
            settings.funcInfoComparator = slamFuncInfoExecTimeMaxHeapComparator;
        }
        return settings as Required<SlamConfigFinderSettings>;
    }

}
