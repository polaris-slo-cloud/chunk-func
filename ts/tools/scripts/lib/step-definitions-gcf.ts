import { FunctionDeploymentStatus, WorkflowStepDescription, WorkflowStepType } from '@chunk-func/core';

/** The validate-video-face-recog function from the face-detection workflow with the GCF profiles. */
export const shortFunctionStepGcf: WorkflowStepDescription = {
    name: 'validate-video-face-recog',
    type: WorkflowStepType.Function,
    profilingResults: {
        profilingDurationSeconds: 142,
        profilingStarted: '2024-01-22T17:34:00Z',
        iterationsPerInputAndProfile: 5,
        results: [
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '128mib-83m',
                results: [
                    {
                        executionCost: 0.000003,
                        executionTimeMs: 977,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 1460,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000006,
                        executionTimeMs: 1837,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 1219,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 2500,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 1399,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '256mib-167m',
                results: [
                    {
                        executionCost: 0.000003,
                        executionTimeMs: 458,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 600,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 778,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 540,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000007,
                        executionTimeMs: 1077,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 600,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '512mib-333m',
                results: [
                    {
                        executionCost: 0.000003,
                        executionTimeMs: 180,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 220,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 258,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 235,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 378,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000003,
                        executionTimeMs: 189,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '1024mib-583m',
                results: [
                    {
                        executionCost: 0.000002,
                        executionTimeMs: 96,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 123,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 130,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 107,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 173,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000005,
                        executionTimeMs: 117,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '2048mib-1000m',
                results: [
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 68,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 77,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 101,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000004,
                        executionTimeMs: 92,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 127,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 102,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '4096mib-2000m',
                results: [
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 68,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 76,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 83,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 68,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000016,
                        executionTimeMs: 115,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000008,
                        executionTimeMs: 95,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '8192mib-2000m',
                results: [
                    {
                        executionCost: 0.00001,
                        executionTimeMs: 62,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00001,
                        executionTimeMs: 71,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00001,
                        executionTimeMs: 87,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00001,
                        executionTimeMs: 77,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000019,
                        executionTimeMs: 102,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00001,
                        executionTimeMs: 100,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '16384mib-4000m',
                results: [
                    {
                        executionCost: 0.00019,
                        executionTimeMs: 61,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00019,
                        executionTimeMs: 75,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00019,
                        executionTimeMs: 84,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00019,
                        executionTimeMs: 75,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.000381,
                        executionTimeMs: 127,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00019,
                        executionTimeMs: 92,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            }
        ]
    }
};

/** The transform-video function from the face-detection workflow with GCF profiles. */
export const mediumFunctionStepGcf: WorkflowStepDescription = {
    name: 'transform-video',
    type: WorkflowStepType.Function,
    profilingResults: {
        profilingDurationSeconds: 6870,
        profilingStarted: '2024-01-23T13:13:27Z',
        iterationsPerInputAndProfile: 5,
        results: [
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '256mib-167m',
                results: [
                    {
                        executionCost: 0.001453,
                        executionTimeMs: 224137,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '512mib-333m',
                results: [
                    {
                        executionCost: 0.001386,
                        executionTimeMs: 106903,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.001819,
                        executionTimeMs: 140467,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.003118,
                        executionTimeMs: 240744,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '1024mib-583m',
                results: [
                    {
                        executionCost: 0.001344,
                        executionTimeMs: 58103,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.001728,
                        executionTimeMs: 74732,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.003102,
                        executionTimeMs: 134216,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.005172,
                        executionTimeMs: 223813,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.003922,
                        executionTimeMs: 169704,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.00644,
                        executionTimeMs: 278740,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '2048mib-1000m',
                results: [
                    {
                        executionCost: 0.001153,
                        executionTimeMs: 28303,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.001559,
                        executionTimeMs: 38313,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.002667,
                        executionTimeMs: 65637,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.004649,
                        executionTimeMs: 114465,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.003646,
                        executionTimeMs: 89752,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.006029,
                        executionTimeMs: 148461,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '4096mib-2000m',
                results: [
                    {
                        executionCost: 0.000885,
                        executionTimeMs: 10855,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.001169,
                        executionTimeMs: 14330,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.002014,
                        executionTimeMs: 24753,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.003475,
                        executionTimeMs: 42770,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.002793,
                        executionTimeMs: 34347,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.004263,
                        executionTimeMs: 52469,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '8192mib-2000m',
                results: [
                    {
                        executionCost: 0.000923,
                        executionTimeMs: 9619,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.001238,
                        executionTimeMs: 12967,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.002075,
                        executionTimeMs: 21756,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.003618,
                        executionTimeMs: 37938,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.002827,
                        executionTimeMs: 29668,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.005693,
                        executionTimeMs: 59756,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '16384mib-4000m',
                results: [
                    {
                        executionCost: 0.008187,
                        executionTimeMs: 4242,
                        inputSizeBytes: 345600,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.010853,
                        executionTimeMs: 5688,
                        inputSizeBytes: 518400,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.018659,
                        executionTimeMs: 9731,
                        inputSizeBytes: 864000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.031226,
                        executionTimeMs: 16353,
                        inputSizeBytes: 1080000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.025133,
                        executionTimeMs: 13194,
                        inputSizeBytes: 1296000,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.040365,
                        executionTimeMs: 21165,
                        inputSizeBytes: 1620000,
                        statusCode: 200
                    }
                ]
            }
        ]
    }
};

/** The detect-faces function from the face-detection workflow with GCF profiles. */
export const longFunctionStepGcf: WorkflowStepDescription = {
    name: 'detect-faces',
    type: WorkflowStepType.Function,
    profilingResults: {
        profilingDurationSeconds: 21393,
        profilingStarted: '2024-01-23T15:25:33Z',
        iterationsPerInputAndProfile: 5,
        results: [
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '128mib-83m',
                results: []
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '256mib-167m',
                results: []
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '512mib-333m',
                results: []
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '1024mib-583m',
                results: []
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '2048mib-1000m',
                results: [
                    {
                        executionCost: 0.015619,
                        executionTimeMs: 384652,
                        inputSizeBytes: 2168077,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.015594,
                        executionTimeMs: 384074,
                        inputSizeBytes: 2200720,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '4096mib-2000m',
                results: [
                    {
                        executionCost: 0.010718,
                        executionTimeMs: 131926,
                        inputSizeBytes: 2168077,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.009249,
                        executionTimeMs: 113818,
                        inputSizeBytes: 2200720,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.019878,
                        executionTimeMs: 244714,
                        inputSizeBytes: 6462780,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.020308,
                        executionTimeMs: 250091,
                        inputSizeBytes: 6478567,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.032407,
                        executionTimeMs: 399099,
                        inputSizeBytes: 14938139,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.032374,
                        executionTimeMs: 398649,
                        inputSizeBytes: 15033099,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '8192mib-2000m',
                results: [
                    {
                        executionCost: 0.011176,
                        executionTimeMs: 117345,
                        inputSizeBytes: 2168077,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.010853,
                        executionTimeMs: 113911,
                        inputSizeBytes: 2200720,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.023324,
                        executionTimeMs: 244931,
                        inputSizeBytes: 6462780,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.025666,
                        executionTimeMs: 269547,
                        inputSizeBytes: 6478567,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.037852,
                        executionTimeMs: 397539,
                        inputSizeBytes: 14938139,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.037909,
                        executionTimeMs: 398200,
                        inputSizeBytes: 15033099,
                        statusCode: 200
                    }
                ]
            },
            {
                deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
                resourceProfileId: '16384mib-4000m',
                results: [
                    {
                        executionCost: 0.093106,
                        executionTimeMs: 48850,
                        inputSizeBytes: 2168077,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.090821,
                        executionTimeMs: 47641,
                        inputSizeBytes: 2200720,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.208298,
                        executionTimeMs: 109363,
                        inputSizeBytes: 6462780,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.207917,
                        executionTimeMs: 109198,
                        inputSizeBytes: 6478567,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.249805,
                        executionTimeMs: 131120,
                        inputSizeBytes: 14938139,
                        statusCode: 200
                    },
                    {
                        executionCost: 0.255326,
                        executionTimeMs: 134003,
                        inputSizeBytes: 15033099,
                        statusCode: 200
                    }
                ]
            }
        ]
    }
};
