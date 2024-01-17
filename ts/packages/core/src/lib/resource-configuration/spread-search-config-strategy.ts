import {
    ProfilingResultsDescExecTimeComparator,
    ResourceProfile,
    getProfilingResultForProfile,
    getResourceProfileId,
    getResultsForInputSizeSorted,
} from '../model';
import {
    ConfiguredWorkflowPath,
    GetStepWeightWithProfileFn,
    WorkflowResourceConfigGraph,
    getAvgExecTimeAcrossAllInputs,
} from '../spread-search';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    ResourceConfigurationStrategy,
    Workflow,
    WorkflowFunctionStep,
    WorkflowGraph,
    WorkflowState,
} from '../workflow';
import { FastestConfigStrategy } from './fastest-config-strategy';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';


const DEFAULT_ESTIMATE_MULTIPLIER = 1.0;
const DEFAULT_SAFETY_MARGIN = 0.01;
const DEFAULT_PROFILE_INCREMENTS = 1;

/** Configuration options for the `SpreadSearchConfigStrategy`. */
export interface SpreadSearchOptions {

    /**
     * SLO weight and optimization weight estimates will be multiplied by this value for steps, for which we don't
     * know the exact input size.
     */
    estimateMultiplier: number;

    /**
     * Defines the minimum spare length that should exist between the current path length and the remaining SLO.
     * The value is a percentage of the remaining SLO.
     *
     * If the difference between the remaining SLO and the projected path length is less than this value,
     * the next higher profile will be picked for the current step, unless it is the last step. *
     */
    safetyMargin: number;

    /**
     * The number of profile increments that should be made, if the safety margin is not maintained.
     *
     * E.g., 1 increment means to switch to the next faster profile.
     */
    profileIncrements: number;

}

export const createSpreadSearchConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow, options?: Record<string, number>) => new SpreadSearchConfigStrategy(workflow.graph, workflow.availableResourceProfiles, options || {});

/**
 * ResourceConfigurationStrategy that relies on a DAG with one node per function and resource configuration combination
 * and tries to find the shortest path through this.
 */
export class SpreadSearchConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'SpreadSearchConfigStrategy';

    private fallbackStrategy: ResourceConfigurationStrategy;
    private options: SpreadSearchOptions;
    private resConfigGraph?: WorkflowResourceConfigGraph;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>, options: Partial<SpreadSearchOptions>) {
        super(SpreadSearchConfigStrategy.strategyName, graph, availableResProfiles);
        this.fallbackStrategy = new FastestConfigStrategy(graph, availableResProfiles);

        this.options = {
            estimateMultiplier: options.estimateMultiplier || DEFAULT_ESTIMATE_MULTIPLIER,
            profileIncrements: options.profileIncrements !== undefined ? options.profileIncrements : DEFAULT_PROFILE_INCREMENTS,
            safetyMargin: options.safetyMargin !== undefined ? options.safetyMargin : DEFAULT_SAFETY_MARGIN,
        };
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        if (!this.resConfigGraph) {
            this.resConfigGraph = new WorkflowResourceConfigGraph(this.workflowGraph, this.availableResourceProfiles);
        }

        const getStepNodeExecTime: GetStepWeightWithProfileFn = (stepNode) => {
            if (stepNode.step.name !== step.name) {
                // return getExecTimeForMaxInput(stepNode);
                const stepWeight = getAvgExecTimeAcrossAllInputs(stepNode);
                stepWeight.sloWeight *= this.options.estimateMultiplier;
                stepWeight.optimizationWeight *= this.options.estimateMultiplier;
                return stepWeight;
            } else {
                const profilingResult = getProfilingResultForProfile(step.profilingResults, input.totalDataSizeBytes, stepNode.resourceProfile);
                return {
                    profilingResult,
                    resourceProfileId: getResourceProfileId(stepNode.resourceProfile),
                    sloWeight: profilingResult.executionTimeMs,
                    optimizationWeight: profilingResult.executionCost,
                };
            }
        };

        const remainingSlo = workflowState.maxExecutionTimeMs - input.thread.executionTimeMs;
        const path = this.resConfigGraph.findSloCompliantPathToEnd(step, remainingSlo, stepNode => getStepNodeExecTime(stepNode));

        if (path) {
            return this.pickSafeResourceProfile(step, path, input, remainingSlo);
        }
        // throw new Error(`There is no path from ${step.name} to the end of the workflow.`);
        return this.fallbackStrategy.chooseConfiguration(workflowState, step, input);
    }

    /**
     * Picks the resource profile for the first step of the `path` based on the result and the configured `SAFETY_MARGIN`.
     */
    private pickSafeResourceProfile(step: WorkflowFunctionStep, path: ConfiguredWorkflowPath, input: AccumulatedStepInput, remainingSlo: number): ResourceProfile {
        const resProfileIdFromPath = path.steps[0].weight!.resourceProfileId;
        const slack = remainingSlo - path.sloWeight;

        // If we have sufficient safety margin at the end or if this is the last step,
        // we return the resource profile from the path.
        if (slack / remainingSlo >= this.options.safetyMargin || path.steps.length === 1) {
            return this.availableResourceProfiles[resProfileIdFromPath];
        }

        // If there is not sufficient safety margin at the end, we return the next faster profile.
        // To this end, we need to sort the profiling results, because more memory does not always mean a faster exec time.
        const sortedProfilingResults = getResultsForInputSizeSorted(step.profilingResults, input.totalDataSizeBytes, ProfilingResultsDescExecTimeComparator);
        const profileFromPathIndex = sortedProfilingResults.findIndex(result => result.resourceProfileId === resProfileIdFromPath);
        if (profileFromPathIndex === -1) {
            throw new Error(`Cannot find profile ${resProfileIdFromPath} in ${step.name}'s profilingResults.`);
        }
        const profileIndex = Math.min(profileFromPathIndex + this.options.profileIncrements, sortedProfilingResults.length - 1);
        const nextFasterProfile = sortedProfilingResults[profileIndex];
        return this.availableResourceProfiles[nextFasterProfile.resourceProfileId];
    }

}

