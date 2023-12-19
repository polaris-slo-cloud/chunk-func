import { ResourceProfile, getResultsForInput } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, WorkflowGraph, WorkflowState, WorkflowFunctionStep, Workflow } from '../workflow';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';

export const createSpreadSearchConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new SpreadSearchConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that relies on a DAG with one node per function and resource configuration combination
 * and tries to find the shortest path through this.
 */
export class SpreadSearchConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'SpreadSearchConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(SpreadSearchConfigStrategy.strategyName, graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        // ToDo: Build exhaustive DAG on first invocation.
    }

}

