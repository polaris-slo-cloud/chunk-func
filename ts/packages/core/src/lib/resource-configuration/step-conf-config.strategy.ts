import { ProfilingResultWithProfileId, ProfilingSessionResults, ResourceProfile, WorkflowStepType } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep, WorkflowStepWeight, WorkflowPath } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createStepConfConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new StepConfConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that picks the configuration according to the Global-cached Most Cost-effective Critical Path Algorithm
 * proposed in the StepConf paper: Zhaojie et al., “StepConf: SLO-Aware Dynamic Resource Configuration for Serverless Function Workflows,”
 * in IEEE INFOCOM 2022 - IEEE Conference on Computer Communications, 2022, pp. 1868–1877.
 *
 * Since StepConf is not aware of the function input sizes, we always use the middle input size.
 */
export class StepConfConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'StepConfConfigStrategy';

    private mostCostEffConfigs: Record<string, ProfilingResultWithProfileId>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(StepConfConfigStrategy.strategyName, graph, availableResProfiles);
        this.mostCostEffConfigs = this.findMostCostEffConfigs(graph);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const remainingTimeMs = workflowState.maxExecutionTimeMs - input.thread.executionTimeMs;
        const criticalPath = this.workflowGraph.findCriticalPath(step, this.workflowGraph.end, currStep => this.getMostCostEffStepWeight(currStep));
        const stepSloMs = this.computeStepSlo(step, criticalPath, remainingTimeMs);

        let selectedProfileCost = Number.POSITIVE_INFINITY;
        let selectedProfileExecTime = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const profilingResult of getResultsForMiddleInput(step.profilingResults)) {
            const stepExecTime = profilingResult.result.executionTimeMs;
            if (stepExecTime <= stepSloMs) {
                const stepExecCost = profilingResult.result.executionCost;
                if (stepExecCost < selectedProfileCost || (stepExecCost === selectedProfileCost && stepExecTime < selectedProfileExecTime)) {
                    selectedProfileCost = stepExecCost;
                    selectedProfileExecTime = stepExecTime;
                    selectedProfileId = profilingResult.resourceProfileId;
                }
            }
        }

        if (!selectedProfileId) {
            selectedProfileId = this.pickFastestProfile(step);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    private getMostCostEffStepWeight(step: WorkflowFunctionStep): WorkflowStepWeight {
        const costEffConfig = this.mostCostEffConfigs[step.name];
        return {
            profilingResult: costEffConfig.result,
            resourceProfileId: costEffConfig.resourceProfileId,
            weight: costEffConfig.result.executionTimeMs,
        };
    }

    /**
     * Computes the SLO for the current step, given the critical path starting from it and based on the remaining time, not the original workflow SLO.
     */
    private computeStepSlo(step: WorkflowFunctionStep, criticalPath: WorkflowPath, remainingTimeMs: number): number {
        const costEffStepWeight = this.getMostCostEffStepWeight(step);
        const percentage = costEffStepWeight.weight / criticalPath.executionTimeMs;
        return remainingTimeMs * percentage;
    }

    private pickFastestProfile(step: WorkflowFunctionStep): string {
        let fastestTime = Number.POSITIVE_INFINITY;
        let fastestCost = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForMiddleInput(step.profilingResults)) {
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
        return selectedProfileId;
    }

    private findMostCostEffConfigs(graph: WorkflowGraph): Record<string, ProfilingResultWithProfileId> {
        const mostCostEffConfigs: Record<string, ProfilingResultWithProfileId> = {};
        for (const stepName in graph.steps) {
            const step = graph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const costEffConfig = this.findMostCostEffConfig(step as WorkflowFunctionStep);
                mostCostEffConfigs[stepName] = costEffConfig;
            }
        }
        return mostCostEffConfigs;
    }

    private findMostCostEffConfig(step: WorkflowFunctionStep): ProfilingResultWithProfileId {
        let mostCostEffProfile: ProfilingResultWithProfileId | undefined;
        let bestCostEff = Number.POSITIVE_INFINITY;

        for (const profilingResult of getResultsForMiddleInput(step.profilingResults)) {
            const costEff = profilingResult.result.executionCost / profilingResult.result.executionTimeMs;
            if (costEff < bestCostEff) {
                bestCostEff = costEff;
                mostCostEffProfile = profilingResult;
            }
        }

        if (!mostCostEffProfile) {
            throw new Error(`Could not find the most cost efficient profile for ${step.name}`);
        }
        return mostCostEffProfile;
    }

}

/**
 * Allows iterating over the ProfilingResults for the input size in the middle of the array.
 */
function* getResultsForMiddleInput(profilingSessionResults: ProfilingSessionResults): Generator<ProfilingResultWithProfileId> {
    for (const profileResult of profilingSessionResults.results) {
        if (!profileResult.results) {
            throw new Error(`ResourceProfileResults for ${profileResult.resourceProfileId} does not contain any results.`);
        }

        const middleIndex = Math.floor(profileResult.results.length / 2);
        const middleInputResult = profileResult.results[middleIndex];

        yield {
            resourceProfileId: profileResult.resourceProfileId,
            result: middleInputResult,
        }
    }
}
