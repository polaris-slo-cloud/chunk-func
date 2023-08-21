import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createPickCheapestConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new PickCheapestConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the cheapest resource configuration, irrespective of the SLO.
 */
export class PickCheapestConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'PickCheapestConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(PickCheapestConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        let lowestCost = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            if (resultForInput.result.executionCost < lowestCost) {
                lowestCost = resultForInput.result.executionCost;
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
