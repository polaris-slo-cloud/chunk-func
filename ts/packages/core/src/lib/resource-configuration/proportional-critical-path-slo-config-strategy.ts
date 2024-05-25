import { ExecutionMetrics, ResourceProfile } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    Workflow,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
    computeStepMeanExecMetricsAllProfiles,
    computeStepsAvgExecMetrics,
} from '../workflow';
import { ProportionalCriticalPathSloConfigStrategyBase } from './proportional-critical-path-slo-config-strategy.base';

export const createProportionalCriticalPathSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new ProportionalCriticalPathSloConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that divides the SLO into parts according to the distribution of the execution times of the profiled functions.
 * This strategy falls back to the FastestConfigStrategy if a particular step cannot find a profile that fulfills the SLO.
 *
 * The two big differences to StepConf are:
 *   1. We are input size aware for the current step.
 *   2. We use the average execution weights for calculating the step execution time contributions and SLO
 *      (StepConf uses the most cost eff resource config for the middle input sizes).
 */
export class ProportionalCriticalPathSloConfigStrategy extends ProportionalCriticalPathSloConfigStrategyBase {

    static readonly strategyName = 'ProportionalCriticalPathSloConfigStrategy';

    /**
     * A map that maps each function step name to its average execution metrics.
     */
    private avgStepExecMetrics: Record<string, ExecutionMetrics>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(ProportionalCriticalPathSloConfigStrategy.strategyName, graph, availableResProfiles);
        this.avgStepExecMetrics = computeStepsAvgExecMetrics(graph.steps, computeStepMeanExecMetricsAllProfiles);
    }

    /**
     * Computes the average execution metrics for all steps starting from `currStep` until the end of the workflow.
     *
     * The values may be precomputed for all steps, if they do not change as more information is available about the execution of the workflow.
     *
     * @returns A map that maps each function step name to its average execution metrics.
     */
    protected override computeAvgExecMetricsUntilEnd(
        workflowState: WorkflowState,
        currStep: WorkflowFunctionStep,
        currStepInput: AccumulatedStepInput,
    ): Record<string, ExecutionMetrics> {
        return this.avgStepExecMetrics;
    }

}
