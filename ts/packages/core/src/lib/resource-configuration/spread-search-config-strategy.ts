import { ResourceProfile, getProfilingResultForProfile, getResourceProfileId, getResultsForInput } from '../model';
import {
    ConfiguredWorkflowPath,
    GetStepWeightWithProfileFn,
    WorkflowResourceConfigGraph,
    getAvgExecTimeAcrossAllInputs,
    getExecTimeForMaxInput,
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

/**
 * SLO weight and optimization weight estimates will be multiplied by this value for steps, for which we don't
 * know the exact input size.
 */
const ESTIMATE_MULTIPLIER = 1.1;

/**
 * Defines the minimum spare length that should exist between the current path length and the remaining SLO.
 * The value is a percentage of the remaining SLO.
 *
 * If the difference between the remaining SLO and the projected path length is less than this value,
 * the next higher profile will be picked for the current step, unless it is the last step. *
 */
const SAFETY_MARGIN = 0.01;

export const createSpreadSearchConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new SpreadSearchConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that relies on a DAG with one node per function and resource configuration combination
 * and tries to find the shortest path through this.
 */
export class SpreadSearchConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'SpreadSearchConfigStrategy';

    private fallbackStrategy: ResourceConfigurationStrategy;
    private resConfigGraph?: WorkflowResourceConfigGraph;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(SpreadSearchConfigStrategy.strategyName, graph, availableResProfiles);
        this.fallbackStrategy = new FastestConfigStrategy(graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        if (!this.resConfigGraph) {
            this.resConfigGraph = new WorkflowResourceConfigGraph(this.workflowGraph, this.availableResourceProfiles);
        }

        const getStepNodeExecTime: GetStepWeightWithProfileFn = (stepNode) => {
            if (stepNode.step.name !== step.name) {
                // return getExecTimeForMaxInput(stepNode);
                const stepWeight = getAvgExecTimeAcrossAllInputs(stepNode);
                stepWeight.sloWeight *= ESTIMATE_MULTIPLIER;
                stepWeight.optimizationWeight *= ESTIMATE_MULTIPLIER;
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
        const path = this.resConfigGraph.findSloCompliantPathToEnd(step, remainingSlo, getStepNodeExecTime);

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
        if (slack / remainingSlo >= SAFETY_MARGIN || path.steps.length === 1) {
            return this.availableResourceProfiles[resProfileIdFromPath];
        }

        // If there is not sufficient safety margin at the end, we return the next higher profile.
        let profileFromPathFound = false;
        for (const resProfile of getResultsForInput(step.profilingResults, input.totalDataSizeBytes)) {
            if (profileFromPathFound) {
                // If the previous profile was the one from the path, we return this one (the next higher one).
                return this.availableResourceProfiles[resProfile.resourceProfileId];
            }
            profileFromPathFound = resProfile.resourceProfileId === resProfileIdFromPath;
        }

        // If we get here, the profile from the path is the highest profile, so we return it.
        return this.availableResourceProfiles[resProfileIdFromPath];
    }

}

