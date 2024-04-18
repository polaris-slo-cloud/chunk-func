import { ResourceProfile, getResultsForInput } from '../../model';
import { AccumulatedStepInput, WorkflowState, WorkflowFunctionStep, GetStepWeightFn, ResourceConfigurationStrategy, WorkflowGraph } from '../../workflow';
import { FastestConfigStrategy } from '../fastest-config-strategy';
import { ResourceConfigurationStrategyBase } from '../resource-configuration-strategy.base';

/**
 * Base class for a ResourceConfigurationStrategy that always picks the cheapest profile that allows fulfilling the SLO.
 *
 * If for a particular step no profile can be found that would fulfill the SLO, the fastest config is used as a fallback.
 */
export abstract class SloCompliantConfigStrategyBase extends ResourceConfigurationStrategyBase {

    private fallbackStrategy: ResourceConfigurationStrategy;

    constructor(name: string, graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(name, graph, availableResProfiles);
        this.fallbackStrategy = new FastestConfigStrategy(graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        // Get the critical path from this step to the end.
        const weightFn = this.getCriticalPathWeightFn(workflowState, step, input);
        const criticalPath = this.workflowGraph.findCriticalPath(step, this.workflowGraph.end, weightFn);

        let selectedProfileCost = Number.POSITIVE_INFINITY;
        let selectedProfileExecTime = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const stepExecTime = resultForInput.result.executionTimeMs;
            const expectedTotalExecTime = input.thread.executionTimeMs + stepExecTime + criticalPath.executionTimeMs;

            if (expectedTotalExecTime <= workflowState.maxExecutionTimeMs) {
                const stepExecCost = resultForInput.result.executionCost;
                if (stepExecCost < selectedProfileCost || (stepExecCost === selectedProfileCost && stepExecTime < selectedProfileExecTime)) {
                    selectedProfileCost = stepExecCost;
                    selectedProfileExecTime = stepExecTime;
                    selectedProfileId = resultForInput.resourceProfileId;
                }
            }
        }

        if (!selectedProfileId) {
            return this.fallbackStrategy.chooseConfiguration(workflowState, step, input);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    /**
     * @returns A GetStepWeightFn used for determining the critical path, which can be generic or base on the input or the executionDescription, etc.
     */
    protected abstract getCriticalPathWeightFn(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): GetStepWeightFn;

}
