import { ExecutionMetrics, WorkflowExecutionDescription, WorkflowStepType, getResultsForInput, isSuccessStatusCode } from '../model';
import { WorkflowFunctionStep, WorkflowStep, WorkflowStepsMap } from './step';

/** Describes a function that estimates the execution metrics of a function. */
export type StepMetricsEstimationStrategy = (step: WorkflowFunctionStep) => ExecutionMetrics;

/**
 * Computes the average exec metrics of all profiles across all input sizes.
 */
export function computeStepMeanExecMetricsAllProfiles(step: WorkflowFunctionStep): ExecutionMetrics {
    let totalExecTime = 0;
    let totalCost = 0;
    let measurementsCount = 0;
    for (const results of step.profilingResults.results) {
        if (!results.results) {
            continue;
        }
        for (const profileResult of results.results) {
            if (isSuccessStatusCode(profileResult.statusCode)) {
                totalExecTime += profileResult.executionTimeMs;
                totalCost += profileResult.executionCost;
                ++measurementsCount;
            }
        }
    }

    if (measurementsCount === 0) {
        throw new Error(`No successful profiling runs for step ${step.name}`);
    }

    return {
        executionTimeMs: totalExecTime / measurementsCount,
        executionCost: totalCost / measurementsCount,
    };
}

/**
 * Computes the average exec metrics of all profiles for the specified input size.
 */
export function computeStepMeanExecMetricsForInputSize(step: WorkflowFunctionStep, inputSize: number): ExecutionMetrics {
    let totalExecTime = 0;
    let totalCost = 0;
    let measurementsCount = 0;
    for (const resultForInput of getResultsForInput(step.profilingResults, inputSize)) {
        totalExecTime += resultForInput.result.executionTimeMs;
        totalCost += resultForInput.result.executionCost;
        ++measurementsCount;
    }

    if (measurementsCount === 0) {
        throw new Error(`No successful profiling runs for step ${step.name}`);
    }

    return {
        executionTimeMs: totalExecTime / measurementsCount,
        executionCost: totalCost / measurementsCount,
    };
}

/**
 * Computes the average execution metrics of the specified `WorkflowSteps`.
 *
 * @param steps The `WorkflowSteps`, for which to compute the average execution times.
 * @param estimationStrategy The `StepWeightEstimationStrategy` to use for estimating the average execution metrics of a step.
 * @returns A map that maps each function step name to its average execution metrics.
 */
export function computeStepsAvgExecMetrics(steps: WorkflowStepsMap, estimationStrategy: StepMetricsEstimationStrategy): Record<string, ExecutionMetrics> {
    const avgExecMetrics: Record<string, ExecutionMetrics> = {};

    for (const stepName in steps) {
        const step = steps[stepName];
        if (step.type === WorkflowStepType.Function) {
            const stepExecMetrics = estimationStrategy(step as WorkflowFunctionStep);
            avgExecMetrics[stepName] = stepExecMetrics;
        }
    }

    return avgExecMetrics;
}

/**
 * Computes a step's input size, based on the `WorkflowExecutionDescription`.s
 */
export function computeStepInputSize(step: WorkflowStep, executionDescription: WorkflowExecutionDescription): number {
    if (!step.requiredInputs) {
        // If there are no required inputs, this is the first step of the workflow.
        return executionDescription.inputSizeBytes;
    }

    let inputSize = 0;
    for (const stepName of step.requiredInputs) {
        const stepExec = executionDescription.stepExecutions[stepName];
        inputSize += stepExec.outputSizeBytes;
    }

    return inputSize;
}
