import { ResourceProfile, findResultForInput } from '../model';
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

        step.profilingResults.results.forEach(profileResults => {
            if (!profileResults.results) {
                throw new Error(`ResourceProfileResults for ${profileResults.resourceProfileId} does not contain any results.`);
            }
            const resultForInput = findResultForInput(input.totalDataSizeBytes, profileResults.results);
            if (resultForInput.executionTimeMs < fastestTime) {
                fastestTime = resultForInput.executionTimeMs;
                fastestProfileId = profileResults.resourceProfileId;
            }
        });

        if (!fastestProfileId) {
            throw new Error('ProfilingResults did not contain any results.');
        }
        const profile = this.availableResourceProfiles[fastestProfileId];
        return profile;
    }

}
