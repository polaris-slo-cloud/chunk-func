import { ResourceProfile, getResultsForInput } from '../model';
import {
    AccumulatedStepInput,
    ResourceConfigurationStrategy,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
    WorkflowStepWeight,
} from '../workflow';
import { FastestConfigStrategy } from './fastest-config-strategy';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

/**
 * Base class for a ResourceConfigurationStrategy that divides the SLO into parts according to the distribution of the execution times of the profiled functions.
 * This strategy falls back to the FastestConfigStrategy if a particular step cannot find a profile that fulfills the SLO.
 */
export abstract class ProportionalCriticalPathSloConfigStrategyBase extends ResourceConfigurationStrategyBase {

    protected fallbackStrategy: ResourceConfigurationStrategy;

    constructor(name: string, graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(name, graph, availableResProfiles);
        this.fallbackStrategy = new FastestConfigStrategy(graph, availableResProfiles);
    }

    /**
     * Computes the average execution times for all steps starting from `currStep` until the end of the workflow.
     *
     * The values may be precomputed for all steps, if they do not change as more information is available about the execution of the workflow.
     *
     * @returns A map that maps each function step name to its average execution time.
     */
    protected abstract computeAvgExecTimesUntilEnd(workflowState: WorkflowState, currStep: WorkflowFunctionStep, currStepInput: AccumulatedStepInput): Record<string, number>;

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const remainingTime = workflowState.maxExecutionTimeMs - input.thread.executionTimeMs;
        const avgExecTimes = this.computeAvgExecTimesUntilEnd(workflowState, step, input);
        const stepSloMs = this.computeStepSlo(step, remainingTime, avgExecTimes);

        let selectedProfileCost = Number.POSITIVE_INFINITY;
        let selectedProfileExecTime = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const stepExecTime = resultForInput.result.executionTimeMs;
            if (stepExecTime <= stepSloMs) {
                const stepExecCost = resultForInput.result.executionCost;
                if (stepExecCost < selectedProfileCost || (stepExecCost === selectedProfileCost && stepExecTime < selectedProfileExecTime)) {
                    selectedProfileCost = stepExecCost;
                    selectedProfileExecTime = stepExecTime;
                    selectedProfileId = resultForInput.resourceProfileId;
                }
            }
        }

        if (!selectedProfileId) {
            return this.fallbackStrategy.chooseConfiguration(workflowState, step, input);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    /**
     * Computes the SLO for the current step, given the critical path starting from it and based on the remaining time, not the original workflow SLO.
     */
    private computeStepSlo(step: WorkflowFunctionStep, remainingTimeMs: number, avgStepExecTimes: Record<string, number>): number {
        const criticalPath = this.workflowGraph.findCriticalPath(step, this.workflowGraph.end, currStep => this.getAvgStepWeight(avgStepExecTimes, currStep));
        const avgStepWeight = this.getAvgStepWeight(avgStepExecTimes, step);
        const criticalPathExecTimeWithSrc = criticalPath.executionTimeMs + avgStepWeight.sloWeight;

        const percentage = avgStepWeight.sloWeight / criticalPathExecTimeWithSrc;
        if (percentage > 1) {
            throw new Error(`Current step percentage is ${percentage}`)
        }
        return remainingTimeMs * percentage;
    }

    private getAvgStepWeight(avgStepExecTimes: Record<string, number>, step: WorkflowFunctionStep): WorkflowStepWeight {
        const avgExecTime = avgStepExecTimes[step.name];
        return {
            // Ugly hack, but we have no profiling result, since this is the average of all profiling results.
            profilingResult: {
                executionCost: -1,
                executionTimeMs: avgExecTime,
                inputSizeBytes: -1,
                statusCode: 200,
            },
            resourceProfileId: '',
            sloWeight: avgExecTime,
            optimizationWeight: -1,
        };
    }

}
