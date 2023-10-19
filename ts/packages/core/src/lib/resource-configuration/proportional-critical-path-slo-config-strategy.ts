import { ResourceProfile, WorkflowStepType, isSuccessStatusCode } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
} from '../workflow';
import { ProportionalCriticalPathSloConfigStrategyBase } from './proportional-critical-path-slo-config-strategy.base';

export const createProportionalCriticalPathSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new ProportionalCriticalPathSloConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that divides the SLO into parts according to the distribution of the execution times of the profiled functions.
 * This strategy falls back to the FastestConfigStrategy if a particular step cannot find a profile that fulfills the SLO.
 *
 * The two big differences to StepConf are:
 *   1. We are input size aware for the current step.
 *   2. We use the average execution times for calculating the step execution time contributions and SLO
 *      (StepConf uses the most cost eff resource config for the middle input sizes).
 */
export class ProportionalCriticalPathSloConfigStrategy extends ProportionalCriticalPathSloConfigStrategyBase {

    static readonly strategyName = 'ProportionalCriticalPathSloConfigStrategy';

    /**
     * A map that maps each function step name to its average execution time.
     */
    private avgStepExecTimes: Record<string, number>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(ProportionalCriticalPathSloConfigStrategy.strategyName, graph, availableResProfiles);
        this.avgStepExecTimes = this.computeAvgExecTimes();
    }

    /**
     * Computes the average execution times for all steps starting from `currStep` until the end of the workflow.
     *
     * The values may be precomputed for all steps, if they do not change as more information is available about the execution of the workflow.
     *
     * @returns A map that maps each function step name to its average execution time.
     */
    protected override computeAvgExecTimesUntilEnd(workflowState: WorkflowState, currStep: WorkflowFunctionStep, currStepInput: AccumulatedStepInput): Record<string, number> {
        return this.avgStepExecTimes;
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

    /**
     * Computes the average exec time of all profiles across all input sizes.
     */
    private computeAvgExecTime(step: WorkflowFunctionStep): number {
        let totalExecTime = 0;
        let measurementsCount = 0;
        for (const results of step.profilingResults.results) {
            if (!results.results) {
                continue;
            }
            for (const profileResult of results.results) {
                if (isSuccessStatusCode(profileResult.statusCode)) {
                    totalExecTime += profileResult.executionTimeMs;
                    ++measurementsCount;
                }
            }
        }

        if (measurementsCount === 0) {
            throw new Error(`No successful profiling runs for step ${step.name}`);
        }

        return totalExecTime / measurementsCount;
    }

}
