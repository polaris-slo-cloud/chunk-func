import { ProfilingResult, findResourceProfileResults, getResourceProfileId } from '../model';
import { WorkflowStepWeight, createSwappedWeightFn } from '../workflow';
import { GetStepWeightWithProfileFn, FunctionNodeResourceConfigAttributes } from './model';

/**
 * Computes the average execution time across input sizes for the resource profile of the node and returns it as the SLO weight.
 *
 * - `sloWeight` = average execution time across input sizes for the resource profile
 * - `optimizationWeight` = average cost across input sizes for the resource profile
 */
export const getAvgExecTimeAcrossAllInputs: GetStepWeightWithProfileFn = (stepNode: FunctionNodeResourceConfigAttributes) => {
    const resultsForProfile = findResourceProfileResults(stepNode.resourceProfile, stepNode.step.profilingResults);
    if (!resultsForProfile || !resultsForProfile.results) {
        throw new Error(`Step ${stepNode.step.name} does not have results for resource profile ${getResourceProfileId(stepNode.resourceProfile)}`);
    }

    const weight: WorkflowStepWeight = {
        resourceProfileId: resultsForProfile.resourceProfileId,
        sloWeight: 0,
        optimizationWeight: 0,
        // Ugly hack, but we are computing the average of all sizes' profiling results.
        profilingResult: {
            executionTimeMs: 0,
            executionCost: 0,
            inputSizeBytes: -1,
            statusCode: 200,
        },
    };

    for (const result of resultsForProfile.results) {
        weight.profilingResult.executionTimeMs += result.executionTimeMs;
        weight.profilingResult.executionCost += result.executionCost;
    }
    weight.profilingResult.executionTimeMs /= resultsForProfile.results.length;
    weight.profilingResult.executionCost /= resultsForProfile.results.length;
    weight.sloWeight = weight.profilingResult.executionTimeMs;
    weight.optimizationWeight = weight.profilingResult.executionCost;

    return weight;
};

/**
 * Computes the average cost across input sizes for the resource profile of the node and returns it as the SLO weight.
 *
 * - `sloWeight` = average cost across input sizes for the resource profile
 * - `optimizationWeight` = average execution time across input sizes for the resource profile
 */
export const getAvgCostAcrossAllInputs: GetStepWeightWithProfileFn = createSwappedWeightFn(getAvgExecTimeAcrossAllInputs);

/**
 * Gets the execution time for the largest input size for the resource profile of the node and returns it as the SLO weight.
 *
 * - `sloWeight` = execution time for the largest input size for the resource profile
 * - `optimizationWeight` = cost for the largest input size for the resource profile
 */
export const getExecTimeForMaxInput: GetStepWeightWithProfileFn = (stepNode: FunctionNodeResourceConfigAttributes) => {
    const resultsForProfile = findResourceProfileResults(stepNode.resourceProfile, stepNode.step.profilingResults);
    if (!resultsForProfile || !resultsForProfile.results) {
        throw new Error(`Step ${stepNode.step.name} does not have results for resource profile ${getResourceProfileId(stepNode.resourceProfile)}`);
    }

    const resultForLargestInput = resultsForProfile.results[resultsForProfile.results.length - 1];

    const weight: WorkflowStepWeight = {
        resourceProfileId: resultsForProfile.resourceProfileId,
        sloWeight: resultForLargestInput!.executionTimeMs,
        optimizationWeight: resultForLargestInput!.executionCost,
        profilingResult: {
            ...resultForLargestInput!,
        },
    };
    return weight;
};

/**
 * Gets the cost for the largest input size for the resource profile of the node and returns it as the SLO weight.
 *
 * - `sloWeight` = cost for the largest input size for the resource profile
 * - `optimizationWeight` = execution time for the largest input size for the resource profile
 */
export const getCostForMaxInput: GetStepWeightWithProfileFn = createSwappedWeightFn(getExecTimeForMaxInput);
