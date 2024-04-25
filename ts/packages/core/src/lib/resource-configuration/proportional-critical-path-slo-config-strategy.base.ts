import { ExecutionMetrics, ResourceProfile, getResultsForInput } from '../model';
import {
    AccumulatedStepInput,
    ResourceConfigurationStrategy,
    ServiceLevelObjective,
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
     * Computes the average execution metrics for all steps starting from `currStep` until the end of the workflow.
     *
     * The values may be precomputed for all steps, if they do not change as more information is available about the execution of the workflow.
     *
     * @returns A map that maps each function step name to its average execution metrics.
     */
    protected abstract computeAvgExecMetricsUntilEnd(
        workflowState: WorkflowState,
        currStep: WorkflowFunctionStep,
        currStepInput: AccumulatedStepInput,
    ): Record<string, ExecutionMetrics>;

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const workflowMetrics = workflowState.slo.getWorkflowWeights(input.thread);
        const remainingSlo = workflowState.slo.sloLimit - workflowMetrics.sloWeight;
        const avgExecMetrics = this.computeAvgExecMetricsUntilEnd(workflowState, step, input);
        const stepSlo = this.computeStepSlo(step, remainingSlo, avgExecMetrics, workflowState.slo);

        let selectedProfileOptWeight = Number.POSITIVE_INFINITY;
        let selectedProfileSloWeight = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const stepWeight = workflowState.slo.getExecutionWeights(resultForInput.result);
            const stepSloWeight = stepWeight.sloWeight;
            if (stepSloWeight <= stepSlo) {
                const stepOptWeight = stepWeight.optimizationWeight;
                if (stepOptWeight < selectedProfileOptWeight || (stepOptWeight === selectedProfileOptWeight && stepSloWeight < selectedProfileSloWeight)) {
                    selectedProfileOptWeight = stepOptWeight;
                    selectedProfileSloWeight = stepSloWeight;
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
     * Computes the SLO for the current step, given the critical path starting from it and based on the remaining SLO, not the original workflow SLO.
     */
    private computeStepSlo(
        step: WorkflowFunctionStep,
        remainingSlo: number,
        avgExecMetrics: Record<string, ExecutionMetrics>,
        slo: ServiceLevelObjective,
    ): number {
        const criticalPath = this.workflowGraph.findCriticalPath(step, this.workflowGraph.end, currStep => this.getAvgStepWeight(avgExecMetrics, currStep, slo));
        const criticalPathWeight = slo.getExecutionWeights(criticalPath);
        const avgStepWeight = this.getAvgStepWeight(avgExecMetrics, step, slo);
        const criticalPathWeightWithSrc = criticalPathWeight.sloWeight + avgStepWeight.sloWeight;

        const percentage = avgStepWeight.sloWeight / criticalPathWeightWithSrc;
        if (percentage > 1) {
            throw new Error(`Current step percentage is ${percentage}`)
        }
        return remainingSlo * percentage;
    }

    private getAvgStepWeight(avgExecMetrics: Record<string, ExecutionMetrics>, step: WorkflowFunctionStep, slo: ServiceLevelObjective): WorkflowStepWeight {
        const avgStepExecMetrics = avgExecMetrics[step.name];
        const avgStepWeight = slo.getExecutionWeights(avgStepExecMetrics);
        return {
            // Ugly hack, but we have no profiling result, since this is the average of all profiling results.
            profilingResult: {
                executionCost: avgStepExecMetrics.executionCost,
                executionTimeMs: avgStepExecMetrics.executionTimeMs,
                inputSizeBytes: -1,
                statusCode: 200,
            },
            resourceProfileId: '',
            sloWeight: avgStepWeight.sloWeight,
            optimizationWeight: avgStepWeight.optimizationWeight,
        };
    }

}
