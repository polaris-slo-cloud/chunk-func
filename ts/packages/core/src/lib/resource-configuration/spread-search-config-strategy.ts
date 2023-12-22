import { ResourceProfile, getProfilingResultForProfile, getResourceProfileId } from '../model';
import { GetStepWeightWithProfileFn, WorkflowResourceConfigGraph, getAvgExecTimeAcrossAllInputs } from '../spread-search';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep, Workflow, WorkflowStep } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createSpreadSearchConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new SpreadSearchConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that relies on a DAG with one node per function and resource configuration combination
 * and tries to find the shortest path through this.
 */
export class SpreadSearchConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'SpreadSearchConfigStrategy';

    private resConfigGraph?: WorkflowResourceConfigGraph;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(SpreadSearchConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        if (!this.resConfigGraph) {
            this.resConfigGraph = new WorkflowResourceConfigGraph(this.workflowGraph, this.availableResourceProfiles);
        }

        const getStepNodeExecTime: GetStepWeightWithProfileFn = (stepNode) => {
            if (stepNode.step.name != step.name) {
                return getAvgExecTimeAcrossAllInputs(stepNode);
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
        const prevStep = this.getSearchStartStep(step);
        const shortestPath = this.resConfigGraph.findSloCompliantPathToEnd(prevStep, remainingSlo, getStepNodeExecTime);

        if (!shortestPath) {
            throw new Error(`There is no path from ${prevStep.name} to the end of the workflow.`);
        }

        // Since the path starts at the previous step, this step has index 1.
        const resProfileId = shortestPath.steps[1].weight!.resourceProfileId;
        return this.availableResourceProfiles[resProfileId];
    }

    private getSearchStartStep(currStep: WorkflowFunctionStep): WorkflowStep {
        if (currStep.requiredInputs && currStep.requiredInputs.length > 0) {
            return this.workflowGraph.steps[currStep.requiredInputs[0]];
        }
        return this.resConfigGraph!.resConfigGraphStart;
    }

}

