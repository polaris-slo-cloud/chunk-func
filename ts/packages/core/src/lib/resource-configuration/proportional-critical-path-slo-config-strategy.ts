import { ResourceProfile, WorkflowStepType, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep, WorkflowPath, WorkflowStepWeight } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createProportionalCriticalPathSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new ProportionalCriticalPathSloConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that divides the SLO into parts according to the distribution of the execution times of the profiled functions.
 *
 * The two big differences to StepConf are:
 *   1. We are input size aware for the current step.
 *   2. We use the average execution times for calculating the step execution time contributions and SLO
 *      (StepConf uses the most cost eff resource config for the middle input sizes).
 */
export class ProportionalCriticalPathSloConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'ProportionalCriticalPathSloConfigStrategy';

    /**
     * A map that maps each function step name to its average execution time.
     */
    private avgStepExecTimes: Record<string, number>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(ProportionalCriticalPathSloConfigStrategy.strategyName, graph, availableResProfiles);
        this.avgStepExecTimes = this.computeAvgExecTimes();
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const remainingTime = workflowState.maxExecutionTimeMs - input.thread.executionTimeMs;
        const stepSloMs = this.computeStepSlo(step, remainingTime);

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
            throw new Error(`Could not find a resource profile that matches the SLO chunk of ${stepSloMs}ms for ${step.name}.`);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    /**
     * Computes the SLO for the current step, given the critical path starting from it and based on the remaining time, not the original workflow SLO.
     */
    private computeStepSlo(step: WorkflowFunctionStep, remainingTimeMs: number): number {
        const criticalPath = this.workflowGraph.findCriticalPath(step, this.workflowGraph.end, currStep => this.getAvgStepWeight(currStep));
        const avgStepWeight = this.getAvgStepWeight(step);
        const criticalPathExecTimeWithSrc = criticalPath.executionTimeMs + avgStepWeight.weight;

        const percentage = avgStepWeight.weight / criticalPathExecTimeWithSrc;
        if (percentage > 1) {
            throw new Error(`Current step percentage is ${percentage}`)
        }
        return remainingTimeMs * percentage;
    }

    private getAvgStepWeight(step: WorkflowFunctionStep): WorkflowStepWeight {
        const avgExecTime = this.avgStepExecTimes[step.name];
        return {
            // Ugly hack, but we have no profiling result, since this is the average of all profiling results.
            profilingResult: {
                executionCost: -1,
                executionTimeMs: avgExecTime,
                inputSizeBytes: -1,
                statusCode: 200,
            },
            resourceProfileId: '',
            weight: avgExecTime,
        };
    }

    /**
     * @returns A map that maps each function step name to its average execution time.
     */
    private computeAvgExecTimes(): Record<string, number> {
        const avgExecTimes: Record<string, number> = {};

        for (const stepName in this.workflowGraph.steps) {
            const step = this.workflowGraph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const stepExecTime = this.computeAvgExecTime(step as WorkflowFunctionStep);
                avgExecTimes[stepName] = stepExecTime;
            }
        }

        return avgExecTimes;
    }

    private computeAvgExecTime(step: WorkflowFunctionStep): number {
        let totalExecTime = 0;
        let measurementsCount = 0;
        for (const results of step.profilingResults.results) {
            if (!results.results) {
                continue;
            }
            for (const profileResult of results.results) {
                totalExecTime += profileResult.executionTimeMs;
                ++measurementsCount;
            }
        }

        return totalExecTime / measurementsCount;
    }

}
