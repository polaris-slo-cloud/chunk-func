import { ResourceProfile, WorkflowStepType, getResultsForInput } from '../model';
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
 * ProportionalCriticalPathSlo ResourceConfigStrategy that recomputes the average step weights every time using only profiling results for the current step's input size,
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
     * Computes the average exec time of all profiles for the specified input size.
     */
    private computeAvgExecTime(step: WorkflowFunctionStep, inputSize: number): number {
        let totalExecTime = 0;
        let measurementsCount = 0;
        for (const resultForInput of getResultsForInput(step.profilingResults, inputSize)) {
            totalExecTime += resultForInput.result.executionTimeMs;
            ++measurementsCount;
        }

        return totalExecTime / measurementsCount;
    }

}
