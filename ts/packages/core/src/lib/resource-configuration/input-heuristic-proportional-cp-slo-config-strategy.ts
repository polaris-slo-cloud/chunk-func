import { ResourceProfile, WorkflowStepType } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
} from '../workflow';
import { ProportionalCriticalPathSloConfigStrategyBase } from './proportional-critical-path-slo-config-strategy.base';

export const createInputHeuristicProportionalCPSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new InputHeuristicProportionalCPSloConfigStrategy(graph, availableResProfiles);

/**
 * ProportionalCriticalPathSlo ResourceConfigStrategy that recomputes the average step weights every time using the current step's input size as the maximum expected size,
 * i.e., we assume that the input size stays the same or decreases and take the average exec time of this size and the smaller ones.
 */
export class InputHeuristicProportionalCPSloConfigStrategy extends ProportionalCriticalPathSloConfigStrategyBase {

    static readonly strategyName = 'InputHeuristicProportionalCPSloConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(InputHeuristicProportionalCPSloConfigStrategy.strategyName, graph, availableResProfiles);
    }

    /**
     * Computes the average execution times for all steps starting from `currStep` until the end of the workflow.
     *
     * The values may be precomputed for all steps, if they do not change as more information is available about the execution of the workflow.
     *
     * @returns A map that maps each function step name to its average execution time.
     */
    protected override computeAvgExecTimesUntilEnd(workflowState: WorkflowState, currStep: WorkflowFunctionStep, currStepInput: AccumulatedStepInput): Record<string, number> {
        const avgExecTimes: Record<string, number> = {};

        for (const stepName in this.workflowGraph.steps) {
            const step = this.workflowGraph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const stepExecTime = this.computeAvgExecTime(step as WorkflowFunctionStep, currStepInput.totalDataSizeBytes);
                avgExecTimes[stepName] = stepExecTime;
            }
        }

        return avgExecTimes;
    }

    /**
     * Computes the average exec time of all profiles with input sizes up to `maxInputSize`.
     */
    private computeAvgExecTime(step: WorkflowFunctionStep, maxInputSize: number): number {
        let totalExecTime = 0;
        let measurementsCount = 0;
        for (const results of step.profilingResults.results) {
            if (!results.results) {
                continue;
            }
            for (const profileResult of results.results) {
                if (profileResult.inputSizeBytes <= maxInputSize) {
                    totalExecTime += profileResult.executionTimeMs;
                    ++measurementsCount;
                }
            }
        }

        return totalExecTime / measurementsCount;
    }

}
