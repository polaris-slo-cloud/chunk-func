import { ExecutionMetrics, ResourceProfile, WorkflowExecutionDescription } from '../../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    Workflow,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
    computeStepInputSize,
    computeStepMeanExecMetricsForInputSize,
    computeStepsAvgExecMetrics,
} from '../../workflow';
import { ProportionalCriticalPathSloConfigStrategyBase } from '../proportional-critical-path-slo-config-strategy.base';

export const createFixedOutputProportionalCPSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new FixedOutputProportionalCPSloConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ProportionalCriticalPathSlo ResourceConfigStrategy that knows all input sizes and uses them for computing the average weights for the critical path.
 */
export class FixedOutputProportionalCPSloConfigStrategy extends ProportionalCriticalPathSloConfigStrategyBase {

    static readonly strategyName = 'FixedOutputProportionalCPSloConfigStrategy';

    /**
     * A map that maps each function step name to its average execution metrics.
     */
    private avgStepExecMetrics?: Record<string, ExecutionMetrics>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(FixedOutputProportionalCPSloConfigStrategy.strategyName, graph, availableResProfiles);
    }

    /**
     * Computes the average execution times for all steps starting from `currStep` until the end of the workflow.
     *
     * The values may be precomputed for all steps, if they do not change as more information is available about the execution of the workflow.
     *
     * @returns A map that maps each function step name to its average execution time.
     */
    protected override computeAvgExecMetricsUntilEnd(workflowState: WorkflowState, currStep: WorkflowFunctionStep, currStepInput: AccumulatedStepInput): Record<string, ExecutionMetrics> {
        if (!this.avgStepExecMetrics) {
            this.avgStepExecMetrics = this.computeAvgExecMetrics(workflowState.executionDescription);
        }
        return this.avgStepExecMetrics;
    }

    /**
     * @returns A map that maps each function step name to its average execution time.
     */
    private computeAvgExecMetrics(executionDescription: WorkflowExecutionDescription): Record<string, ExecutionMetrics> {
        const avgExecMetrics = computeStepsAvgExecMetrics(
            this.workflowGraph.steps,
            (funcStep) => {
                const stepInputSize = computeStepInputSize(funcStep, executionDescription);
                return computeStepMeanExecMetricsForInputSize(funcStep, stepInputSize);
            },
        );
        return avgExecMetrics;
    }

}
