import { Comparator } from 'heap-js';
import { ProfilingResult } from '../model';
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

export const slamFunctionInfoMaxHeapComparator: Comparator<SlamFunctionInfo> =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => b.profilingResult.executionTimeMs - a.profilingResult.executionTimeMs;
