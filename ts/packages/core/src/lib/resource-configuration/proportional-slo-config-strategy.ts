import { ResourceProfile, WorkflowStepType, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createProportionalSloConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new ProportionalSloConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that divides the SLO into parts according to the distribution of the execution times of the profiled functions.
 *
 * IMPORTANT: This currently only works for simple workflows with a single path of execution (i.e., no forks or joins).
 * ToDo: consider using the critical path from the current point, like StepConf, then forks and joins might work as well.
 *
 * The two big differences to StepConf are:
 *   1. We are input size aware for the current step.
 *   2. We use the average execution times for calculating the step execution time contributions and SLO
 *      (StepConf uses the most cost eff resource config for the middle input sizes).
 */
export class ProportionalSloConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'ProportionalSloConfigStrategy';

    /**
     * A map that maps each function step name to its contribution percentage of the total workflow execution time.
     */
    private stepExecTimeContribs: Record<string, number>;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(ProportionalSloConfigStrategy.strategyName, graph, availableResProfiles);
        this.stepExecTimeContribs = this.computeExecTimeDistribution();
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const stepSloMs = workflowState.maxExecutionTimeMs * this.stepExecTimeContribs[step.name];
        let selectedProfileCost = Number.POSITIVE_INFINITY;
        let selectedProfileExecTime = Number.POSITIVE_INFINITY;
        let selectedProfileId: string | undefined;

        for (const resultForInput of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            const stepExecTime = resultForInput.result.executionTimeMs;
            if (stepExecTime <= stepSloMs) {
                const stepExecCost = resultForInput.result.executionCost;
                if (stepExecCost < selectedProfileCost || (stepExecCost === selectedProfileCost && stepExecTime < selectedProfileExecTime)) {
                    selectedProfileCost = stepExecCost;
                    selectedProfileExecTime = stepExecTime;
                    selectedProfileId = resultForInput.resourceProfileId;
                }
            }
        }

        if (!selectedProfileId) {
            throw new Error(`Could not find a resource profile that matches the SLO chunk of ${stepSloMs}ms for ${step.name}.`);
        }
        const profile = this.availableResourceProfiles[selectedProfileId];
        return profile;
    }

    /**
     * Computes the percentage of time that each function contributes to the whole workflow.
     *
     * @returns A map that maps each function step name to its contribution percentage.
     */
    private computeExecTimeDistribution(): Record<string, number> {
        const avgExecTimes: Record<string, number> = {};
        let totalExecTime = 0;

        for (const stepName in this.workflowGraph.steps) {
            const step = this.workflowGraph.steps[stepName];
            if (step.type !== WorkflowStepType.Function || (step.requiredInputs && step.requiredInputs.length > 1)) {
                throw new Error(`${ProportionalSloConfigStrategy.strategyName} only supports simple workflows with with a single path of execution (i.e., no forks or joins).`)
            }
            const stepExecTime = this.computeAvgExecTime(step as WorkflowFunctionStep);
            avgExecTimes[stepName] = stepExecTime;
            totalExecTime += stepExecTime;
        }

        for (const stepName in avgExecTimes) {
            const stepExecTime = avgExecTimes[stepName];
            avgExecTimes[stepName] = stepExecTime / totalExecTime;
        }

        return avgExecTimes;
    }

    private computeAvgExecTime(step: WorkflowFunctionStep): number {
        let totalExecTime = 0;
        let measurementsCount = 0;
        for (const results of step.profilingResults.results) {
            if (!results.results) {
                continue;
            }
            for (const profileResult of results.results) {
                totalExecTime += profileResult.executionTimeMs;
                ++measurementsCount;
            }
        }

        return totalExecTime / measurementsCount;
    }

}
