import { ResourceProfile } from '../model';
import { SlamConfigFinder } from '../slam';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, Workflow, WorkflowFunctionStep, WorkflowInput, WorkflowState } from '../workflow';
import { PreconfiguredConfigStrategy } from './preconfigured-config-strategy';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createSlamConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new SlamConfigStrategy(workflow);

/**
 * ResourceConfigurationStrategy that runs the SLAM algorithm on a training input and uses the result from that
 * as the predefined choices for the resource configurations during the workflow execution.
 */
export class SlamConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'SlamConfigStrategy';

    private workflow: Workflow;
    private preconfiguredStrategy: PreconfiguredConfigStrategy | undefined;

    constructor(workflow: Workflow) {
        super(SlamConfigStrategy.strategyName, workflow.graph, workflow.availableResourceProfiles);
        this.workflow = workflow;
    }

    train(slo: number, trainingInput: WorkflowInput<unknown>): any {
        const configFinder = new SlamConfigFinder(this.workflow);

        // To realistically compare to the other approaches we need to use the eval SLO with the SLAM profiling data.
        const slamResult = configFinder.optimizeForSloAndCost(slo, trainingInput);

        this.preconfiguredStrategy = new PreconfiguredConfigStrategy(this.workflowGraph, this.availableResourceProfiles, slamResult.stepConfigs);
        return slamResult;
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        if (!this.preconfiguredStrategy) {
            throw new Error('The train() method must be called once before SlamConfigStrategy.chooseConfiguration()');
        }

        return this.preconfiguredStrategy.chooseConfiguration(workflowState, step, input);
    }

}