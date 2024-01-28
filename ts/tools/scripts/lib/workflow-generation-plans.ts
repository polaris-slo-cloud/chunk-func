import { WorkflowDescription } from '@chunk-func/core';
import { FunctionAndInput, WorkflowGenerationPlan } from './model';

export const workflowHeader: WorkflowDescription = {
    name: 'generated-workflow',
    startStep: 'start',
    endStep: 'end',
    availableResourceProfiles: [
        {
            memoryMiB: 128,
            milliCpu: 83,
            price100Ms: 3.24e-7
        },
        {
            memoryMiB: 256,
            milliCpu: 167,
            price100Ms: 6.48e-7
        },
        {
            memoryMiB: 512,
            milliCpu: 333,
            price100Ms: 0.000001295
        },
        {
            memoryMiB: 1024,
            milliCpu: 583,
            price100Ms: 0.00000231
        },
        {
            memoryMiB: 2048,
            milliCpu: 1000,
            price100Ms: 0.00000406
        },
        {
            memoryMiB: 4096,
            milliCpu: 2000,
            price100Ms: 0.00000812
        },
        {
            memoryMiB: 8192,
            milliCpu: 2000,
            price100Ms: 0.00000952
        },
        {
            memoryMiB: 16384,
            milliCpu: 4000,
            price100Ms: 0.0001904
        }
    ],
    steps: [],
};

export function getHomogeneousWorkflowPlan(stepsCount: number, funcAndInputs: FunctionAndInput): WorkflowGenerationPlan {
    return [
        { functionsAndInputs: [ funcAndInputs ], stepsCount },
    ];
}

export function getHalfHalfWorkflowPlan(stepsPerHalf: number, funcAndInputsFirst: FunctionAndInput, funcAndInputsSecond: FunctionAndInput): WorkflowGenerationPlan {
    return [
        { functionsAndInputs: [ funcAndInputsFirst ], stepsCount: stepsPerHalf },
        { functionsAndInputs: [ funcAndInputsSecond ], stepsCount: stepsPerHalf },
    ];
}

export function getCyclicWorkflowPlan(cyclesCount: number, cycleDef: FunctionAndInput[]): WorkflowGenerationPlan {
    const ret: WorkflowGenerationPlan = [];
    for (let i = 0; i < cyclesCount; ++i) {
        for (const step of cycleDef) {
            ret.push({ functionsAndInputs: [ step ], stepsCount: 1 });
        }
    }
    return ret;
}

export function getStaircaseWorkflowPlan(stepsPerLevel: number, levels: FunctionAndInput[]): WorkflowGenerationPlan {
    return levels.map(level => ({
        functionsAndInputs: [ level ],
        stepsCount: stepsPerLevel,
    }));
}
