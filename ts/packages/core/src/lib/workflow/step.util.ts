import { WorkflowExecutionDescription, WorkflowStepType, getResultsForInput, isSuccessStatusCode } from '../model';
import { WorkflowFunctionStep, WorkflowStep, WorkflowStepsMap } from './step';

/** Describes a function that estimates the execution time of a function. */
export type StepExecTimeEstimationStrategy = (step: WorkflowFunctionStep) => number;

/**
 * Computes the average exec time of all profiles across all input sizes.
 */
export function computeStepMeanExecTimeAllProfiles(step: WorkflowFunctionStep): number {
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

/**
 * Computes the average exec time of all profiles for the specified input size.
 */
export function computeStepMeanExecTimeForInputSize(step: WorkflowFunctionStep, inputSize: number): number {
    let totalExecTime = 0;
    let measurementsCount = 0;
    for (const resultForInput of getResultsForInput(step.profilingResults, inputSize)) {
        totalExecTime += resultForInput.result.executionTimeMs;
        ++measurementsCount;
    }

    if (measurementsCount === 0) {
        throw new Error(`No successful profiling runs for step ${step.name}`);
    }

    return totalExecTime / measurementsCount;
}

/**
 * Computes the average execution times of the specified `WorkflowSteps`.
 *
 * @param steps The `WorkflowSteps`, for which to compute the average execution times.
 * @param estimationStrategy The `StepExecTimeEstimationStrategy` to use for estimating the average execution time of a step.
 * @returns A map that maps each function step name to its average execution time.
 */
export function computeStepsAvgExecTimes(steps: WorkflowStepsMap, estimationStrategy: StepExecTimeEstimationStrategy): Record<string, number> {
    const avgExecTimes: Record<string, number> = {};

    for (const stepName in steps) {
        const step = steps[stepName];
        if (step.type === WorkflowStepType.Function) {
            const stepExecTime = estimationStrategy(step as WorkflowFunctionStep);
            avgExecTimes[stepName] = stepExecTime;
        }
    }

    return avgExecTimes;
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
