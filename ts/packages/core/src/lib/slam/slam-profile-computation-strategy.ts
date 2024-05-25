import { ProfilingResult, ResourceProfile, getAllResults, getProfilingResultForProfile, getResourceProfileId } from '../model';
import { WorkflowFunctionStep } from '../workflow';

/**
 * Strategy used by SLAM to compute the `ProfilingResult` (i.e., exec time and cost) for a `WorkflowFunctionStep` under a specific `ResourceProfile`.
 *
 * By default SLAM uses the the `ProfilingResult` for the provided input size, but alternative strategies can be used,
 * e.g., average over all input sizes.
 */
export type SlamProfilingResultComputationStrategy =
    (step: WorkflowFunctionStep, stepInputSize: number, resProfile: ResourceProfile, ) => ProfilingResult;

/**
 * Default `SlamProfilingResultComputationStrategy` that returns the `ProfilingResult` that matches the specified `stepInputSize`.
 */
export const getExactInputSizeProfilingResult: SlamProfilingResultComputationStrategy =
    (step: WorkflowFunctionStep, stepInputSize: number, resProfile: ResourceProfile, ) => getProfilingResultForProfile(step.profilingResults, stepInputSize, resProfile);


/**
 * `SlamProfilingResultComputationStrategy` that returns the average exec time and cost of across all input sizes, except for the
 * current step, where it uses the known input size.
 */
export function createMeanProfilingResultAllInputsStrategy(currStep: WorkflowFunctionStep): SlamProfilingResultComputationStrategy {
    return (step: WorkflowFunctionStep, stepInputSize: number, resProfile: ResourceProfile, ) => {
        if (step.name != currStep.name) {
            return computeStepMeanExecTimeForInputSize(step, resProfile);
        } else {
            return getProfilingResultForProfile(step.profilingResults, stepInputSize, resProfile);
        }
    }
}

/**
 * Computes the average exec time of all input sizes for the specified profile.
 */
function computeStepMeanExecTimeForInputSize(step: WorkflowFunctionStep, resProfile: ResourceProfile): ProfilingResult {
    const profileId = getResourceProfileId(resProfile);
    const ret: ProfilingResult = {
        statusCode: 200,
        inputSizeBytes: -1,
        executionCost: 0,
        executionTimeMs: 0,
    };
    let measurementsCount = 0;

    for (const result of getAllResults(step.profilingResults)) {
        if (result.resourceProfileId === profileId) {
            ret.executionTimeMs += result.result.executionTimeMs;
            ret.executionCost += result.result.executionCost;
            ++measurementsCount;
        }
    }

    if (measurementsCount === 0) {
        throw new Error(`No successful profiling runs for step ${step.name}`);
    }

    ret.executionTimeMs /= measurementsCount;
    ret.executionCost /= measurementsCount;
    return ret;
}
