import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createPickFastestConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new PickFastestConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the fastest resource configuration, irrespective of the SLO.
 */
export class PickFastestConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'PickFastestConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(PickFastestConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        let fastestTime = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            if (resultForInput.result.executionTimeMs < fastestTime) {
                fastestTime = resultForInput.result.executionTimeMs;
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
