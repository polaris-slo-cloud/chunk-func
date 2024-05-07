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
import { computeStepSlo, findBestProfileForStepSlo } from './util';

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
        const workflowMetrics = workflowState.getExecutionMetrics(input.thread);
        const workflowWeights = workflowState.slo.getExecutionWeights(workflowMetrics);
        const remainingSlo = workflowState.slo.sloLimit - workflowWeights.sloWeight;
        const avgExecMetrics = this.computeAvgExecMetricsUntilEnd(workflowState, step, input);
        const stepSlo = computeStepSlo(
            this.workflowGraph,
            step,
            remainingSlo,
            workflowState.slo,
            currStep => this.getAvgStepWeight(avgExecMetrics, currStep, workflowState.slo),
        );

        const selectedProfileId = findBestProfileForStepSlo(
            workflowState.slo,
            stepSlo,
            getResultsForInput(step.profilingResults, input.totalDataSizeBytes),
        );

        if (!selectedProfileId) {
            return this.fallbackStrategy.chooseConfiguration(workflowState, step, input);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
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
