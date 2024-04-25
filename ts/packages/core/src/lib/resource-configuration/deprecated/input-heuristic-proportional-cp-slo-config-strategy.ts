import { ExecutionMetrics, ResourceProfile } from '../../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    Workflow,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
    computeStepMeanExecMetricsForInputSize,
    computeStepsAvgExecMetrics,
} from '../../workflow';
import { ProportionalCriticalPathSloConfigStrategyBase } from '../proportional-critical-path-slo-config-strategy.base';

export const createInputHeuristicProportionalCPSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new InputHeuristicProportionalCPSloConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

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
    protected override computeAvgExecMetricsUntilEnd(workflowState: WorkflowState, currStep: WorkflowFunctionStep, currStepInput: AccumulatedStepInput): Record<string, ExecutionMetrics> {
        const avgExecTimes = computeStepsAvgExecMetrics(
            this.workflowGraph.steps,
            (stepToEstimate) => computeStepMeanExecMetricsForInputSize(stepToEstimate, currStepInput.totalDataSizeBytes),
        );
        return avgExecTimes;
    }

}
