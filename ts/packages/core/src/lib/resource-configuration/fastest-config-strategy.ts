import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createFastestConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new FastestConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the fastest resource configuration, irrespective of the SLO.
 */
export class FastestConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'FastestConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(FastestConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        let fastestTime = Number.POSITIVE_INFINITY;
        let fastestCost = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const execTime = resultForInput.result.executionTimeMs;
            const execCost = resultForInput.result.executionCost;
            // We pick the fastest or, if two are equally fast, the cheaper of the two.
            if (execTime < fastestTime || (execTime === fastestTime && execCost < fastestCost)) {
                fastestTime = execTime;
                fastestCost = execCost;
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