import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createCheapestConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new CheapestConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the cheapest resource configuration, irrespective of the SLO.
 */
export class CheapestConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'CheapestConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(CheapestConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        let lowestCost = Number.POSITIVE_INFINITY;
        let selectedProfileExecTime = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const execCost = resultForInput.result.executionCost;
            const execTime = resultForInput.result.executionTimeMs;
            if (execCost < lowestCost || (execCost === lowestCost && execTime < selectedProfileExecTime)) {
                lowestCost = execCost;
                selectedProfileExecTime = execTime;
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
