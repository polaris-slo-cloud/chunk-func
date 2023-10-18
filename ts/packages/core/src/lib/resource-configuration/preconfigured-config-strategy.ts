import { ResourceProfile } from '../model';
import { AccumulatedStepInput, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

/**
 * ResourceConfigurationStrategy that always picks a predefined resource configuration for each step.
 * This strategy can be used to evaluate the execution time of different input sizes for a workflow under a particular configuration.
 *
 * There is no factory for this strategy, because it is only used for evaluating a already determined config.
 */
export class PreconfiguredConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'PreconfiguredConfigStrategy';

    /**
     * The predetermined configurations for each function step.
     */
    private stepConfigs: Record<string, ResourceProfile>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>, stepConfigs: Record<string, ResourceProfile>) {
        super(PreconfiguredConfigStrategy.strategyName, graph, availableResProfiles);
        this.stepConfigs = stepConfigs;
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const profile = this.stepConfigs[step.name];
        if (!profile) {
            throw new Error(`No predetermined resource profile for step ${step.name}`);
        }
        return profile;
    }

}
