import { ResourceProfile, WorkflowExecutionDescription, WorkflowStepType, getResultsForInput } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
} from '../workflow';
import { ProportionalCriticalPathSloConfigStrategyBase } from './proportional-critical-path-slo-config-strategy.base';

export const createFixedOutputProportionalCPSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new FixedOutputProportionalCPSloConfigStrategy(graph, availableResProfiles);

/**
 * ProportionalCriticalPathSlo ResourceConfigStrategy that knows all input sizes and uses them for computing the average weights for the critical path.
 */
export class FixedOutputProportionalCPSloConfigStrategy extends ProportionalCriticalPathSloConfigStrategyBase {

    static readonly strategyName = 'FixedOutputProportionalCPSloConfigStrategy';

    /**
     * A map that maps each function step name to its average execution time.
     */
    private avgStepExecTimes?: Record<string, number>;

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
    protected override computeAvgExecTimesUntilEnd(workflowState: WorkflowState, currStep: WorkflowFunctionStep, currStepInput: AccumulatedStepInput): Record<string, number> {
        if (!this.avgStepExecTimes) {
            this.avgStepExecTimes = this.computeAvgExecTimes(workflowState.executionDescription);
        }
        return this.avgStepExecTimes;
    }

    /**
     * @returns A map that maps each function step name to its average execution time.
     */
    private computeAvgExecTimes(executionDescription: WorkflowExecutionDescription): Record<string, number> {
        const avgExecTimes: Record<string, number> = {};

        for (const stepName in this.workflowGraph.steps) {
            const step = this.workflowGraph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const funcStep = step as WorkflowFunctionStep;
                const stepInputSize = this.computeStepInputSize(funcStep, executionDescription);
                const stepExecTime = this.computeAvgExecTime(funcStep, stepInputSize);
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

    private computeStepInputSize(step: WorkflowFunctionStep, executionDescription: WorkflowExecutionDescription): number {
        if (!step.requiredInputs) {
            return 0;
        }

        let inputSize = 0;
        for (const stepName of step.requiredInputs) {
            const stepExec = executionDescription.stepExecutions[stepName];
            inputSize += stepExec.outputSizeBytes;
        }

        return inputSize;
    }

}
