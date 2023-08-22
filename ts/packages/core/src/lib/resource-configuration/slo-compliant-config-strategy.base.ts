import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, WorkflowState, WorkflowFunctionStep, GetStepWeightFn } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

/**
 * Base class for a ResourceConfigurationStrategy that always picks the cheapest profile that allows fulfilling the SLO.
 */
export abstract class SloCompliantConfigStrategyBase extends ResourceConfigurationStrategyBase {

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        // Get the critical path from this step to the end.
        const weightFn = this.getCriticalPathWeightFn(workflowState, step, input);
        const criticalPath = this.workflowGraph.findCriticalPath(step, this.workflowGraph.end, weightFn);

        let selectedProfileCost = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const expectedTotalExecTime = resultForInput.result.executionTimeMs + criticalPath.executionTimeMs;
            if (expectedTotalExecTime <= workflowState.maxExecutionTimeMs) {
                if (resultForInput.result.executionCost < selectedProfileCost) {
                    selectedProfileCost = resultForInput.result.executionCost;
                    selectedProfileId = resultForInput.resourceProfileId;
                }
            }
        }

        if (!selectedProfileId) {
            throw new Error('Could not find a profile that allows meeting the SLO.');
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    /**
     * @returns A GetStepWeightFn used for determining the critical path, which can be generic or base on the input or the executionDescription, etc.
     */
    protected abstract getCriticalPathWeightFn(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): GetStepWeightFn;

}
