import { cloneDeep } from 'lodash';
import { ResourceProfile } from '../../model';
import {
    SlamConfigFinder,
    createCostIncreaseMinHeapComparator,
    createExecTimeImprovementMaxHeapComparator,
    createMeanProfilingResultAllInputsStrategy,
    slamFuncInfoOptWeightMinHeapComparator,
    slamFuncInfoSloWeightMaxHeapComparator,
} from '../../slam';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    ResourceConfigurationStrategy,
    ServiceLevelObjective,
    Workflow,
    WorkflowFunctionStep,
    WorkflowInput,
    WorkflowState,
    computeWorkflowStepsInputSizes,
    getResourceProfilesSortedByMemory,
} from '../../workflow';
import { FastestConfigStrategy } from '../fastest-config-strategy';
import { ResourceConfigurationStrategyBase } from '../resource-configuration-strategy.base';

export const createOnlineSlamConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new OnlineSlamConfigStrategy(workflow);

/**
 * ResourceConfigurationStrategy that runs the SLAM algorithm in an online fashion on the remaining workflow state.
 * It is aware of the input data size for the current function step.
 *
 * SLAM was originally proposed in this paper:
 * G. Safaryan, A. Jindal, M. Chadha, and M. Gerndt, “SLAM: SLO-Aware Memory Optimization for Serverless Applications,”
 * in 2022 IEEE 15th International Conference on Cloud Computing (CLOUD), 2022, pp. 30–39.
 */
export class OnlineSlamConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'OnlineSlamConfigStrategy';

    private fallbackStrategy: ResourceConfigurationStrategy;
    private workflow: Workflow;
    private trainingInput: WorkflowInput<unknown> | undefined;
    private resourceProfilesSortedByMem: ResourceProfile[];

    constructor(workflow: Workflow) {
        super(OnlineSlamConfigStrategy.strategyName, workflow.graph, workflow.availableResourceProfiles);
        this.fallbackStrategy = new FastestConfigStrategy(workflow.graph, workflow.availableResourceProfiles);
        this.workflow = workflow;
        this.resourceProfilesSortedByMem = getResourceProfilesSortedByMemory(workflow);
    }

    train(slo: ServiceLevelObjective, trainingInput: WorkflowInput<unknown>): any {
        this.trainingInput = trainingInput;
        return undefined;
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        // Clone the training input (median input sizes) and set the input of the current step
        // to the actual, known input to make the current step input size-aware.
        const slamInput = cloneDeep(this.trainingInput!);
        slamInput.data = {
            sizeBytes: input.totalDataSizeBytes,
        }
        slamInput.executionDescription.inputSizeBytes = input.totalDataSizeBytes;

        const workflowMetrics = workflowState.slo.getWorkflowWeights(input.thread);
        const remainingSlo = workflowState.slo.sloLimit - workflowMetrics.sloWeight;
        slamInput.executionDescription.sloLimit = remainingSlo;

        const subWorkflow = this.workflow.createSubWorkflow(step);
        const subSlo = workflowState.slo.cloneWithNewLimit(remainingSlo);

        // max-heap with SLO weight (default)
        // const slamConfigFinder = new SlamConfigFinder(subWorkflow, { funcInfoComparator: slamFuncInfoSloWeightMaxHeapComparator });

        // min-heap with optimization weight
        // const slamConfigFinder = new SlamConfigFinder(subWorkflow, { funcInfoComparator: slamFuncInfoOptWeightMinHeapComparator });

        // max-heap with mean exec time across all input sizes
        const slamConfigFinder = new SlamConfigFinder(subWorkflow, {
            funcInfoComparator: slamFuncInfoSloWeightMaxHeapComparator,
            profileComputationStrategy: createMeanProfilingResultAllInputsStrategy(step),
        });

        // const stepInputSizes = computeWorkflowStepsInputSizes(subWorkflow.graph, slamInput);
        // const slamConfigFinder = new SlamConfigFinder(
        //     subWorkflow,
        //     {
        //         // max-heap with potential exec time improvement
        //         funcInfoComparator: createExecTimeImprovementMaxHeapComparator(this.resourceProfilesSortedByMem, stepInputSizes),

        //         // min-heap with potential cost increase
        //         // funcInfoComparator: createCostIncreaseMinHeapComparator(this.resourceProfilesSortedByMem, stepInputSizes),
        //     },
        // );

        const slamOutput = slamConfigFinder.optimizeForSloAndCost(subSlo, slamInput);
        if (slamOutput) {
            return slamOutput.stepConfigs[step.name];
        }
        return this.fallbackStrategy.chooseConfiguration(workflowState, step, input);
    }

}
