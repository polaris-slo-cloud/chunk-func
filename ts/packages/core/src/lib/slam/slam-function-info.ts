import { Comparator } from 'heap-js';
import { ProfilingResult, ResourceProfile, getProfilingResultForProfile } from '../model';
import { WorkflowFunctionStep } from '../workflow';

export interface SlamFunctionInfo {

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
 * Comparator for establishing a max-heap using the profiling results' `executionTimeMs`.
 */
export const slamFuncInfoExecTimeMaxHeapComparator: SlamFunctionInfoComparator =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => b.profilingResult.executionTimeMs - a.profilingResult.executionTimeMs;

/**
 * Comparator for establishing a min-heap using the costs.
 */
export const slamFuncInfoCostsMinHeapComparator: SlamFunctionInfoComparator =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => a.profilingResult.executionCost - b.profilingResult.executionCost;

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
