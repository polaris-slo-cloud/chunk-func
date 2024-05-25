import { WorkflowDescription } from '@chunk-func/core';
import { FunctionAndInput, WorkflowGenerationPlan } from './model';

const workflowHeaderGcf: WorkflowDescription = {
    name: 'generated-workflow',
    startStep: 'start',
    endStep: 'end',
    availableResourceProfiles: [
        {
            memoryMiB: 128,
            milliCpu: 83,
            pricePerUnit: 3.24e-7,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 256,
            milliCpu: 167,
            pricePerUnit: 6.48e-7,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 512,
            milliCpu: 333,
            pricePerUnit: 0.000001295,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 1024,
            milliCpu: 583,
            pricePerUnit: 0.00000231,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 2048,
            milliCpu: 1000,
            pricePerUnit: 0.00000406,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 4096,
            milliCpu: 2000,
            pricePerUnit: 0.00000812,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 8192,
            milliCpu: 2000,
            pricePerUnit: 0.00000952,
            billingUnitMs: 100,
        },
        {
            memoryMiB: 16384,
            milliCpu: 4000,
            pricePerUnit: 0.0001904,
            billingUnitMs: 100,
        }
    ],
    steps: [],
};

const workflowHeaderAws: WorkflowDescription = {
    name: 'generated-workflow',
    startStep: 'start',
    endStep: 'end',
    availableResourceProfiles: [
        {
            memoryMiB: 128,
            milliCpu: 1000,
            pricePerUnit: 2.1e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 192,
            milliCpu: 1000,
            pricePerUnit: 3.1333333333333333e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 256,
            milliCpu: 1000,
            pricePerUnit: 4.166666666666666e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 320,
            milliCpu: 1000,
            pricePerUnit: 5.2e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 384,
            milliCpu: 1000,
            pricePerUnit: 6.233333333333333e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 448,
            milliCpu: 1000,
            pricePerUnit: 7.266666666666667e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 512,
            milliCpu: 1000,
            pricePerUnit: 8.3e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 576,
            milliCpu: 1000,
            pricePerUnit: 9.35e-9,
            billingUnitMs: 1
        },
        {
            memoryMiB: 640,
            milliCpu: 1000,
            pricePerUnit: 1.04e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 704,
            milliCpu: 1000,
            pricePerUnit: 1.145e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 768,
            milliCpu: 1000,
            pricePerUnit: 1.25e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 832,
            milliCpu: 1000,
            pricePerUnit: 1.355e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 896,
            milliCpu: 1000,
            pricePerUnit: 1.46e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 960,
            milliCpu: 1000,
            pricePerUnit: 1.565e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1024,
            milliCpu: 1000,
            pricePerUnit: 1.67e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1088,
            milliCpu: 1000,
            pricePerUnit: 1.77375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1152,
            milliCpu: 1000,
            pricePerUnit: 1.8775e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1216,
            milliCpu: 1000,
            pricePerUnit: 1.98125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1280,
            milliCpu: 1000,
            pricePerUnit: 2.0849999999999998e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1344,
            milliCpu: 1000,
            pricePerUnit: 2.18875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1408,
            milliCpu: 1000,
            pricePerUnit: 2.2925e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1472,
            milliCpu: 1000,
            pricePerUnit: 2.39625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1536,
            milliCpu: 1000,
            pricePerUnit: 2.5e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1600,
            milliCpu: 1000,
            pricePerUnit: 2.6037499999999997e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1664,
            milliCpu: 1000,
            pricePerUnit: 2.7075e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1728,
            milliCpu: 1000,
            pricePerUnit: 2.81125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1792,
            milliCpu: 2000,
            pricePerUnit: 2.915e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1856,
            milliCpu: 2000,
            pricePerUnit: 3.01875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1920,
            milliCpu: 2000,
            pricePerUnit: 3.1225000000000003e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 1984,
            milliCpu: 2000,
            pricePerUnit: 3.22625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2048,
            milliCpu: 2000,
            pricePerUnit: 3.33e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2112,
            milliCpu: 2000,
            pricePerUnit: 3.434375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2176,
            milliCpu: 2000,
            pricePerUnit: 3.53875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2240,
            milliCpu: 2000,
            pricePerUnit: 3.643125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2304,
            milliCpu: 2000,
            pricePerUnit: 3.7474999999999996e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2368,
            milliCpu: 2000,
            pricePerUnit: 3.851875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2432,
            milliCpu: 2000,
            pricePerUnit: 3.95625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2496,
            milliCpu: 2000,
            pricePerUnit: 4.060625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2560,
            milliCpu: 2000,
            pricePerUnit: 4.165e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2624,
            milliCpu: 2000,
            pricePerUnit: 4.269375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2688,
            milliCpu: 2000,
            pricePerUnit: 4.37375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2752,
            milliCpu: 2000,
            pricePerUnit: 4.478125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2816,
            milliCpu: 2000,
            pricePerUnit: 4.5825e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2880,
            milliCpu: 2000,
            pricePerUnit: 4.686875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 2944,
            milliCpu: 2000,
            pricePerUnit: 4.79125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3008,
            milliCpu: 2000,
            pricePerUnit: 4.895625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3072,
            milliCpu: 2000,
            pricePerUnit: 5e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3136,
            milliCpu: 2000,
            pricePerUnit: 5.104375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3200,
            milliCpu: 2000,
            pricePerUnit: 5.2087499999999996e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3264,
            milliCpu: 2000,
            pricePerUnit: 5.3131249999999995e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3328,
            milliCpu: 2000,
            pricePerUnit: 5.4174999999999994e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3392,
            milliCpu: 2000,
            pricePerUnit: 5.521875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3456,
            milliCpu: 2000,
            pricePerUnit: 5.62625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3520,
            milliCpu: 2000,
            pricePerUnit: 5.730625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3584,
            milliCpu: 3000,
            pricePerUnit: 5.8349999999999996e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3648,
            milliCpu: 3000,
            pricePerUnit: 5.9393749999999995e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3712,
            milliCpu: 3000,
            pricePerUnit: 6.04375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3776,
            milliCpu: 3000,
            pricePerUnit: 6.148125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3840,
            milliCpu: 3000,
            pricePerUnit: 6.2525e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3904,
            milliCpu: 3000,
            pricePerUnit: 6.356875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 3968,
            milliCpu: 3000,
            pricePerUnit: 6.46125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4032,
            milliCpu: 3000,
            pricePerUnit: 6.565625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4096,
            milliCpu: 3000,
            pricePerUnit: 6.67e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4160,
            milliCpu: 3000,
            pricePerUnit: 6.77375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4224,
            milliCpu: 3000,
            pricePerUnit: 6.877499999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4288,
            milliCpu: 3000,
            pricePerUnit: 6.981249999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4352,
            milliCpu: 3000,
            pricePerUnit: 7.085e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4416,
            milliCpu: 3000,
            pricePerUnit: 7.18875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4480,
            milliCpu: 3000,
            pricePerUnit: 7.2925e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4544,
            milliCpu: 3000,
            pricePerUnit: 7.39625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4608,
            milliCpu: 3000,
            pricePerUnit: 7.5e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4672,
            milliCpu: 3000,
            pricePerUnit: 7.60375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4736,
            milliCpu: 3000,
            pricePerUnit: 7.7075e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4800,
            milliCpu: 3000,
            pricePerUnit: 7.811249999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4864,
            milliCpu: 3000,
            pricePerUnit: 7.914999999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4928,
            milliCpu: 3000,
            pricePerUnit: 8.01875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 4992,
            milliCpu: 3000,
            pricePerUnit: 8.1225e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5056,
            milliCpu: 3000,
            pricePerUnit: 8.22625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5120,
            milliCpu: 3000,
            pricePerUnit: 8.33e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5184,
            milliCpu: 3000,
            pricePerUnit: 8.434375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5248,
            milliCpu: 3000,
            pricePerUnit: 8.53875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5312,
            milliCpu: 4000,
            pricePerUnit: 8.643125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5376,
            milliCpu: 4000,
            pricePerUnit: 8.7475e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5440,
            milliCpu: 4000,
            pricePerUnit: 8.851874999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5504,
            milliCpu: 4000,
            pricePerUnit: 8.956249999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5568,
            milliCpu: 4000,
            pricePerUnit: 9.060624999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5632,
            milliCpu: 4000,
            pricePerUnit: 9.165e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5696,
            milliCpu: 4000,
            pricePerUnit: 9.269374999999999e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5760,
            milliCpu: 4000,
            pricePerUnit: 9.37375e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5824,
            milliCpu: 4000,
            pricePerUnit: 9.478125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5888,
            milliCpu: 4000,
            pricePerUnit: 9.5825e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 5952,
            milliCpu: 4000,
            pricePerUnit: 9.686875e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6016,
            milliCpu: 4000,
            pricePerUnit: 9.79125e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6080,
            milliCpu: 4000,
            pricePerUnit: 9.895625e-8,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6144,
            milliCpu: 4000,
            pricePerUnit: 1e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6208,
            milliCpu: 4000,
            pricePerUnit: 1.0104375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6272,
            milliCpu: 4000,
            pricePerUnit: 1.020875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6336,
            milliCpu: 4000,
            pricePerUnit: 1.0313124999999999e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6400,
            milliCpu: 4000,
            pricePerUnit: 1.0417499999999999e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6464,
            milliCpu: 4000,
            pricePerUnit: 1.0521875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6528,
            milliCpu: 4000,
            pricePerUnit: 1.062625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6592,
            milliCpu: 4000,
            pricePerUnit: 1.0730625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6656,
            milliCpu: 4000,
            pricePerUnit: 1.0835e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6720,
            milliCpu: 4000,
            pricePerUnit: 1.0939375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6784,
            milliCpu: 4000,
            pricePerUnit: 1.104375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6848,
            milliCpu: 4000,
            pricePerUnit: 1.1148125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6912,
            milliCpu: 4000,
            pricePerUnit: 1.1252500000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 6976,
            milliCpu: 4000,
            pricePerUnit: 1.1356875000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7040,
            milliCpu: 4000,
            pricePerUnit: 1.1461250000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7104,
            milliCpu: 5000,
            pricePerUnit: 1.1565625000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7168,
            milliCpu: 5000,
            pricePerUnit: 1.167e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7232,
            milliCpu: 5000,
            pricePerUnit: 1.177375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7296,
            milliCpu: 5000,
            pricePerUnit: 1.18775e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7360,
            milliCpu: 5000,
            pricePerUnit: 1.198125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7424,
            milliCpu: 5000,
            pricePerUnit: 1.2085e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7488,
            milliCpu: 5000,
            pricePerUnit: 1.218875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7552,
            milliCpu: 5000,
            pricePerUnit: 1.22925e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7616,
            milliCpu: 5000,
            pricePerUnit: 1.239625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7680,
            milliCpu: 5000,
            pricePerUnit: 1.2500000000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7744,
            milliCpu: 5000,
            pricePerUnit: 1.2603750000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7808,
            milliCpu: 5000,
            pricePerUnit: 1.2707500000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7872,
            milliCpu: 5000,
            pricePerUnit: 1.2811250000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 7936,
            milliCpu: 5000,
            pricePerUnit: 1.2915000000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8000,
            milliCpu: 5000,
            pricePerUnit: 1.3018750000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8064,
            milliCpu: 5000,
            pricePerUnit: 1.31225e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8128,
            milliCpu: 5000,
            pricePerUnit: 1.322625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8192,
            milliCpu: 5000,
            pricePerUnit: 1.333e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8256,
            milliCpu: 5000,
            pricePerUnit: 1.3434375000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8320,
            milliCpu: 5000,
            pricePerUnit: 1.353875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8384,
            milliCpu: 5000,
            pricePerUnit: 1.3643125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8448,
            milliCpu: 5000,
            pricePerUnit: 1.37475e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8512,
            milliCpu: 5000,
            pricePerUnit: 1.3851875000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8576,
            milliCpu: 5000,
            pricePerUnit: 1.395625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8640,
            milliCpu: 5000,
            pricePerUnit: 1.4060625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8704,
            milliCpu: 5000,
            pricePerUnit: 1.4165e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8768,
            milliCpu: 5000,
            pricePerUnit: 1.4269375000000001e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8832,
            milliCpu: 5000,
            pricePerUnit: 1.437375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8896,
            milliCpu: 6000,
            pricePerUnit: 1.4478124999999998e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 8960,
            milliCpu: 6000,
            pricePerUnit: 1.45825e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9024,
            milliCpu: 6000,
            pricePerUnit: 1.4686875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9088,
            milliCpu: 6000,
            pricePerUnit: 1.479125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9152,
            milliCpu: 6000,
            pricePerUnit: 1.4895624999999998e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9216,
            milliCpu: 6000,
            pricePerUnit: 1.5e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9280,
            milliCpu: 6000,
            pricePerUnit: 1.5104375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9344,
            milliCpu: 6000,
            pricePerUnit: 1.520875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9408,
            milliCpu: 6000,
            pricePerUnit: 1.5313125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9472,
            milliCpu: 6000,
            pricePerUnit: 1.54175e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9536,
            milliCpu: 6000,
            pricePerUnit: 1.5521875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9600,
            milliCpu: 6000,
            pricePerUnit: 1.562625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9664,
            milliCpu: 6000,
            pricePerUnit: 1.5730625e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9728,
            milliCpu: 6000,
            pricePerUnit: 1.5834999999999999e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9792,
            milliCpu: 6000,
            pricePerUnit: 1.5939375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9856,
            milliCpu: 6000,
            pricePerUnit: 1.604375e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9920,
            milliCpu: 6000,
            pricePerUnit: 1.6148125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 9984,
            milliCpu: 6000,
            pricePerUnit: 1.62525e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 10048,
            milliCpu: 6000,
            pricePerUnit: 1.6356875e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 10112,
            milliCpu: 6000,
            pricePerUnit: 1.646125e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 10176,
            milliCpu: 6000,
            pricePerUnit: 1.6565625000000002e-7,
            billingUnitMs: 1
        },
        {
            memoryMiB: 10240,
            milliCpu: 6000,
            pricePerUnit: 1.667e-7,
            billingUnitMs: 1
        }
    ],
    steps: [],
};

export const workflowHeaders: Record<string, WorkflowDescription> = {
    'gcf': workflowHeaderGcf,
    'aws': workflowHeaderAws,
    'aws-bo': workflowHeaderAws,
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
