import { Comparator } from 'heap-js';
import { ProfilingResult, ResourceProfile, getProfilingResultForProfile } from '../model';
import { WeightMetrics, WorkflowFunctionStep } from '../workflow';

/**
 * Collects all SLAM-related information about a `WorkflowFunctionStep`.
 */
export interface SlamFunctionInfo {

    /** The `WorkflowFunctionStep` that is described by this info object. */
    step: WorkflowFunctionStep;

    /**
     * The index of the resource profile that is currently selected for this function.
     *
     * IMPORTANT: This index refers to the array of availableProfiles,
     * not the step's profilingResults, which may be shorter because it may start with a more performant profile.
     */
    selectedProfileIndex: number;

    /** The profiling result with the selected profile. */
    profilingResult: ProfilingResult;

    /** The weights of the step according to the current SLO. */
    stepWeight: WeightMetrics;

}

/**
 * Comparator used to determine the order of the functions in the SLAM heap.
 *
 * The function should return the following values:
 * - positive number if `b` goes up in the heap (e.g., `b > a` in a max-heap)
 * - 0 if `a == b`
 * - negative number if `a` goes up in the heap (e.g., `b < a` in a max-heap)
 */
export type SlamFunctionInfoComparator = Comparator<SlamFunctionInfo>;

/**
 * Comparator for establishing a max-heap using the functions' `sloWeight`.
 */
export const slamFuncInfoSloWeightMaxHeapComparator: SlamFunctionInfoComparator =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => b.stepWeight.sloWeight - a.stepWeight.sloWeight;

/**
 * Comparator for establishing a min-heap using the `optimizationWeight`.
 */
export const slamFuncInfoOptWeightMinHeapComparator: SlamFunctionInfoComparator =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => a.stepWeight.optimizationWeight - b.stepWeight.optimizationWeight;

/**
 * Creates a comparator for establishing a max-heap using the potential execution time improvements when switching
 * to the next higher profile.
 */
export function createExecTimeImprovementMaxHeapComparator(
    availableProfiles: ResourceProfile[],
    stepInputSizes: Record<string, number>,
): SlamFunctionInfoComparator {
    return (a: SlamFunctionInfo, b: SlamFunctionInfo) => {
        const aImprovement = getPotentialExecTimeImprovement(a, availableProfiles, stepInputSizes[a.step.name]);
        const bImprovement = getPotentialExecTimeImprovement(b, availableProfiles, stepInputSizes[b.step.name]);
        return bImprovement - aImprovement;
    };
}

/**
 * Computes the potential execution time improvement when using the next higher profile for the specified function.
 */
function getPotentialExecTimeImprovement(func: SlamFunctionInfo, availableProfiles: ResourceProfile[], stepInputSize: number): number {
    const nextProfileIndex = func.selectedProfileIndex + 1;
    if (nextProfileIndex === availableProfiles.length) {
        throw new Error(`Cannot compute exec time improvement for ${func.step.name}, because it is already using the highest profile.`);
    }

    const nextHigherProfilingResult = getProfilingResultForProfile(
        func.step.profilingResults,
        stepInputSize,
        availableProfiles[nextProfileIndex],
    );
    const currExecTime = func.profilingResult.executionTimeMs;
    return currExecTime - nextHigherProfilingResult.executionTimeMs;
}

/**
 * Creates a comparator for establishing a min-heap using the potential cost increase when switching
 * to the next higher profile.
 */
export function createCostIncreaseMinHeapComparator(
    availableProfiles: ResourceProfile[],
    stepInputSizes: Record<string, number>,
): SlamFunctionInfoComparator {
    return (a: SlamFunctionInfo, b: SlamFunctionInfo) => {
        const aCostIncrease = getPotentialCostIncrease(a, availableProfiles, stepInputSizes[a.step.name]);
        const bCostIncrease = getPotentialCostIncrease(b, availableProfiles, stepInputSizes[b.step.name]);
        return aCostIncrease - bCostIncrease;
    };
}

/**
 * Computes the potential cost increase when using the next higher profile for the specified function.
 *
 * Note that the increase may also be a negative number, if the reduced exec time with a higher profile yields a lower cost.
 */
function getPotentialCostIncrease(func: SlamFunctionInfo, availableProfiles: ResourceProfile[], stepInputSize: number): number {
    const nextProfileIndex = func.selectedProfileIndex + 1;
    if (nextProfileIndex === availableProfiles.length) {
        throw new Error(`Cannot cost increase for ${func.step.name}, because it is already using the highest profile.`);
    }

    const nextHigherProfilingResult = getProfilingResultForProfile(
        func.step.profilingResults,
        stepInputSize,
        availableProfiles[nextProfileIndex],
    );
    const currCost = func.profilingResult.executionCost;
    return nextHigherProfilingResult.executionCost - currCost;
}
