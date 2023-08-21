import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, ResourceConfigurationStrategy, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';

export const createPickFastestConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new PickFastestConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the fastest resource configuration, irrespective of the SLO.
 */
export class PickFastestConfigStrategy implements ResourceConfigurationStrategy {

    static readonly strategyName = 'PickFastestConfigStrategy';

    readonly name = PickFastestConfigStrategy.strategyName;
    readonly workflowGraph: WorkflowGraph;
    readonly availableResourceProfiles: Record<string, ResourceProfile>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        this.workflowGraph = graph;
        this.availableResourceProfiles = availableResProfiles;
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        let fastestTime = Number.POSITIVE_INFINITY;
        let fastestProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            if (resultForInput.result.executionTimeMs < fastestTime) {
                fastestTime = resultForInput.result.executionTimeMs;
                fastestProfileId = resultForInput.resourceProfileId;
            }
        }

        if (!fastestProfileId) {
            throw new Error('ProfilingResults did not contain any results.');
        }
        const profile = this.availableResourceProfiles[fastestProfileId];
        return profile;
    }

}
