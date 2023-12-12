import { cloneDeep } from 'lodash';
import { ResourceProfile } from '../model';
import { SlamConfigFinder } from '../slam';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    ResourceConfigurationStrategy,
    Workflow,
    WorkflowFunctionStep,
    WorkflowInput,
    WorkflowState,
} from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';
import { FastestConfigStrategy } from './fastest-config-strategy';

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

    constructor(workflow: Workflow) {
        super(OnlineSlamConfigStrategy.strategyName, workflow.graph, workflow.availableResourceProfiles);
        this.fallbackStrategy = new FastestConfigStrategy(workflow.graph, workflow.availableResourceProfiles);
        this.workflow = workflow;
    }

    train(slo: number, trainingInput: WorkflowInput<unknown>): any {
        this.trainingInput = trainingInput;
        return undefined;
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const remainingTime = workflowState.maxExecutionTimeMs - input.thread.executionTimeMs;
        const slamInput = cloneDeep(this.trainingInput!);
        slamInput.data = {
            sizeBytes: input.totalDataSizeBytes,
        }
        slamInput.executionDescription.inputSizeBytes = input.totalDataSizeBytes;
        slamInput.executionDescription.maxResponseTimeMs = remainingTime;

        const subWorkflow = this.workflow.createSubWorkflow(step);
        const slamConfigFinder = new SlamConfigFinder(subWorkflow);

        const slamOutput = slamConfigFinder.optimizeForSloAndCost(remainingTime, slamInput);
        if (slamOutput) {
            return slamOutput.stepConfigs[step.name];
        }
        return this.fallbackStrategy.chooseConfiguration(workflowState, step, input);
    }

}
