import { ProfilingResultWithProfileId, getAllResults, getResultsForInput } from '../model';
import { WorkflowFunctionStep } from './step';
import { GetStepWeightFn } from './workflow-graph';

/**
 * Returns the longest possible execution time of the WorkflowStep.
 */
export const getLongestExecutionTime: GetStepWeightFn = (step: WorkflowFunctionStep) => {
    let longestExecTime = 0;
    let selectedResult: ProfilingResultWithProfileId | undefined;

    for (const result of getAllResults(step.profilingResults)) {
        if (result.result.executionTimeMs > longestExecTime) {
            longestExecTime = result.result.executionTimeMs;
            selectedResult = result;
        }
    }

    if (!selectedResult) {
        throw new Error(`Step ${step.name} does not contain any profiling results or no successful profiling results.`)
    }

    return {
        sloWeight: longestExecTime,
        optimizationWeight: selectedResult.result.executionCost,
        resourceProfileId: selectedResult.resourceProfileId,
        profilingResult: selectedResult.result,
    };
};

/**
 * Creates a GetStepWeightFn that returns the longest possible execution time for the specified input size.
 */
export function getLongestExecutionTimeForInput(inputSizeBytes: number): GetStepWeightFn {
    return (step: WorkflowFunctionStep) => {
        let longestExecTime = 0;
        let longestExecTimeCost = Number.POSITIVE_INFINITY;
        let selectedResult: ProfilingResultWithProfileId | undefined;

        for (const result of getResultsForInput(step.profilingResults, inputSizeBytes)) {
            const execCost = result.result.executionCost;
            const execTime = result.result.executionTimeMs;
            if (execTime > longestExecTime || (execTime === longestExecTime && execCost < longestExecTimeCost)) {
                longestExecTime = execTime;
                longestExecTimeCost = execCost;
                selectedResult = result;
            }
        }

        if (!selectedResult) {
            throw new Error(`Step ${step.name} does not contain any profiling results.`)
        }

        return {
            sloWeight: longestExecTime,
            optimizationWeight: longestExecTimeCost,
            resourceProfileId: selectedResult.resourceProfileId,
            profilingResult: selectedResult.result,
        };
    }
}

/**
 * Creates a GetStepWeightFn that returns the fastest possible execution time for the specified input size.
 */
export function getFastestExecutionTimeForInput(inputSizeBytes: number): GetStepWeightFn {
    return (step: WorkflowFunctionStep) => {
        let fastestExecTime = Number.POSITIVE_INFINITY;
        let fastestExecTimeCost = Number.POSITIVE_INFINITY;
        let selectedResult: ProfilingResultWithProfileId | undefined;

        for (const result of getResultsForInput(step.profilingResults, inputSizeBytes)) {
            const execCost = result.result.executionCost;
            const execTime = result.result.executionTimeMs;
            if (execTime < fastestExecTime || (execTime === fastestExecTime && execCost < fastestExecTimeCost)) {
                fastestExecTime = execTime;
                fastestExecTimeCost = execCost;
                selectedResult = result;
            }
        }

        if (!selectedResult) {
            throw new Error(`Step ${step.name} does not contain any profiling results.`)
        }

        return {
            sloWeight: fastestExecTime,
            optimizationWeight: fastestExecTimeCost,
            resourceProfileId: selectedResult.resourceProfileId,
            profilingResult: selectedResult.result,
        };
    }
}

/**
 * Creates a GetStepWeightFn that returns the cheapest possible execution time for the specified input size.
 */
export function getCheapestExecutionTimeForInput(inputSizeBytes: number): GetStepWeightFn {
    return (step: WorkflowFunctionStep) => {
        let lowestCost = Number.POSITIVE_INFINITY;
        let selectedResultExecTime = Number.POSITIVE_INFINITY;
        let selectedResult: ProfilingResultWithProfileId | undefined;

        for (const result of getResultsForInput(step.profilingResults, inputSizeBytes)) {
            const execCost = result.result.executionCost;
            const execTime = result.result.executionTimeMs;
            if (execCost < lowestCost || (execCost === lowestCost && execTime < selectedResultExecTime)) {
                lowestCost = execCost;
                selectedResultExecTime = execTime;
                selectedResult = result;
            }
        }

        if (!selectedResult) {
            throw new Error(`Step ${step.name} does not contain any profiling results.`)
        }

        return {
            sloWeight: selectedResult.result.executionTimeMs,
            optimizationWeight: selectedResult.result.executionCost,
            resourceProfileId: selectedResult.resourceProfileId,
            profilingResult: selectedResult.result,
        };
    }
}
