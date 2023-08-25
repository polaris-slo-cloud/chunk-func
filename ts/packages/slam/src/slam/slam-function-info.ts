import { WorkflowFunctionStep } from '@chunk-func/core';
import { Comparator } from 'heap-js';

export interface SlamFunctionInfo {

    step: WorkflowFunctionStep;
    selectedProfileIndex: number;
    executionTimeWithProfile: number;

}

export const slamFunctionInfoMaxHeapComparator: Comparator<SlamFunctionInfo> =
    (a: SlamFunctionInfo, b: SlamFunctionInfo) => b.executionTimeWithProfile - a.executionTimeWithProfile;
