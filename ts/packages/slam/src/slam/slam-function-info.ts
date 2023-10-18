import { ProfilingResult, WorkflowFunctionStep } from '@chunk-func/core';
import { Comparator } from 'heap-js';

export interface SlamFunctionInfo {

    step: WorkflowFunctionStep;
    selectedProfileIndex: number;

    /** The profiling result with the selected profile. */
    profilingResult: ProfilingResult;

}

export const slamFunctionInfoMaxHeapComparator: Comparator<SlamFunctionInfo> =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => b.profilingResult.executionTimeMs - a.profilingResult.executionTimeMs;
