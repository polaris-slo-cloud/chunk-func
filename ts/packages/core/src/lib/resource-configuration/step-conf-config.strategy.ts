import { ProfilingResultWithProfileId, ProfilingSessionResults, ResourceProfile, WorkflowStepType, isSuccessStatusCode } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep, WorkflowStepWeight, Workflow, ServiceLevelObjective } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';
import { computeStepSlo, findBestProfileForStepSlo } from './util';

export const createStepConfConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new StepConfConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that picks the configuration according to the Global-cached Most Cost-effective Critical Path Algorithm
 * proposed in the StepConf paper: Zhaojie et al., “StepConf: SLO-Aware Dynamic Resource Configuration for Serverless Function Workflows,”
 * in IEEE INFOCOM 2022 - IEEE Conference on Computer Communications, 2022, pp. 1868–1877.
 *
 * Since StepConf is not aware of the function input sizes, we always use the middle input size.
 *
 * This is an adapted version of StepConf, which allows arbitrary SLOs by abstracting the response time and cost into an SLO weight and an optimization weight.
 * The most cost-effective profile (lowest value for `cost / responseTimeMs`) becomes the most effective profile (lowest value for `optWeight / sloWeight`).
 */
export class StepConfConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'StepConfConfigStrategy';

    private mostEffectiveConfigs: Record<string, ProfilingResultWithProfileId> | undefined;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(StepConfConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const workflowMetrics = workflowState.getExecutionMetrics(input.thread);
        const workflowWeights = workflowState.slo.getExecutionWeights(workflowMetrics);
        const remainingSlo = workflowState.slo.sloLimit - workflowWeights.sloWeight;
        const stepSlo = computeStepSlo(
            this.workflowGraph,
            step,
            remainingSlo,
            workflowState.slo,
            currStep => this.getMostEffectiveStepWeight(currStep, workflowState.slo),
        );

        let selectedProfileId = findBestProfileForStepSlo(
            workflowState.slo,
            stepSlo,
            getResultsForMiddleInput(step.profilingResults),
        );

        if (!selectedProfileId) {
            selectedProfileId = this.pickFastestProfile(step);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    private getMostEffectiveStepWeight(step: WorkflowFunctionStep, slo: ServiceLevelObjective): WorkflowStepWeight {
        if (!this.mostEffectiveConfigs) {
            this.mostEffectiveConfigs = this.findMostEffectiveConfigs(this.workflowGraph, slo);
        }

        const costEffConfig = this.mostEffectiveConfigs[step.name];
        const stepWeights = slo.getExecutionWeights(costEffConfig.result);
        return {
            profilingResult: costEffConfig.result,
            resourceProfileId: costEffConfig.resourceProfileId,
            sloWeight: stepWeights.sloWeight,
            optimizationWeight: stepWeights.optimizationWeight,
        };
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
            throw new Error('ProfilingResults did not contain any results or no successful results.');
        }
        return selectedProfileId;
    }

    private findMostEffectiveConfigs(graph: WorkflowGraph, slo: ServiceLevelObjective): Record<string, ProfilingResultWithProfileId> {
        const mostEffConfigs: Record<string, ProfilingResultWithProfileId> = {};
        for (const stepName in graph.steps) {
            const step = graph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const effectiveConfig = this.findMostEffectiveConfig(step as WorkflowFunctionStep, slo);
                mostEffConfigs[stepName] = effectiveConfig;
            }
        }
        return mostEffConfigs;
    }

    private findMostEffectiveConfig(step: WorkflowFunctionStep, slo: ServiceLevelObjective): ProfilingResultWithProfileId {
        let mostEffProfile: ProfilingResultWithProfileId | undefined;
        let bestEffectiveness = Number.POSITIVE_INFINITY;

        for (const profilingResult of getResultsForMiddleInput(step.profilingResults)) {
            const profileWeights = slo.getExecutionWeights(profilingResult.result)
            const profileEff = profileWeights.optimizationWeight / profileWeights.sloWeight;
            if (profileEff < bestEffectiveness) {
                bestEffectiveness = profileEff;
                mostEffProfile = profilingResult;
            }
        }

        if (!mostEffProfile) {
            throw new Error(`Could not find the most cost efficient profile for ${step.name}`);
        }
        return mostEffProfile;
    }

}

/**
 * Allows iterating over the ProfilingResults for the input size in the middle of the array.
 */
function* getResultsForMiddleInput(profilingSessionResults: ProfilingSessionResults): Generator<ProfilingResultWithProfileId> {
    for (const profileResult of profilingSessionResults.results) {
        if (!profileResult.results || profileResult.results.length === 0) {
            throw new Error(`ResourceProfileResults for ${profileResult.resourceProfileId} does not contain any results.`);
        }

        const middleIndex = Math.floor((profileResult.results.length - 1) / 2);
        const middleInputResult = profileResult.results[middleIndex];

        if (isSuccessStatusCode(middleInputResult.statusCode)) {
            yield {
                resourceProfileId: profileResult.resourceProfileId,
                result: middleInputResult,
            }
        }
    }
}
