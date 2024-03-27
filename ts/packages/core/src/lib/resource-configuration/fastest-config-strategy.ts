import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep, Workflow } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createFastestConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new FastestConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that always picks the fastest resource configuration, irrespective of the SLO.
 *
 * This strategy relies on the `exhaustiveProfilingResults`, because its output are used as reference points.
 * Thus, they should not be biased by any inferred profiling results.
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

        for (const resultForInput of getResultsForInput(step.exhaustiveProfilingResults, input.totalDataSizeBytes)) {
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
            throw new Error('ExhaustiveProfilingResults did not contain any results.');
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

}
