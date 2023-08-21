import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createPickSlowestConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new PickSlowestConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the slowest resource configuration, irrespective of the SLO.
 */
export class PickSlowestConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'PickSlowestConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(PickSlowestConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        let slowestTime = 0;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            if (resultForInput.result.executionTimeMs > slowestTime) {
                slowestTime = resultForInput.result.executionTimeMs;
                selectedProfileId = resultForInput.resourceProfileId;
            }
        }

        if (!selectedProfileId) {
            throw new Error('ProfilingResults did not contain any results.');
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

}
