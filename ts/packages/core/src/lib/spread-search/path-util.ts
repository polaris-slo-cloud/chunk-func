import { findResourceProfileResults, getResourceProfileId } from '../model';
import { WorkflowStepWeight } from '../workflow';
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
export const getAvgCostAcrossAllInputs: GetStepWeightWithProfileFn = (stepNode: FunctionNodeResourceConfigAttributes) => {
    const weight = getAvgExecTimeAcrossAllInputs(stepNode);
    weight.sloWeight = weight.profilingResult.executionCost;
    weight.optimizationWeight = weight.profilingResult.executionTimeMs;
    return weight;
}
