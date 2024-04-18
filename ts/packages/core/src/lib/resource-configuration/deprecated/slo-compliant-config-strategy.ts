import { ResourceProfile } from '../../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowGraph,
    WorkflowState,
    WorkflowFunctionStep,
    GetStepWeightFn,
    getCheapestExecutionTimeForInput,
    getFastestExecutionTimeForInput,
    Workflow,
} from '../../workflow';
import { SloCompliantConfigStrategyBase } from './slo-compliant-config-strategy.base';

export const createSloCompliantConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new SloCompliantConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that always picks the cheapest profile that allows fulfilling the SLO.
 */
export class SloCompliantConfigStrategy extends SloCompliantConfigStrategyBase {

    static readonly strategyName = 'SloCompliantConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(SloCompliantConfigStrategy.strategyName, graph, availableResProfiles);
    }

    protected override getCriticalPathWeightFn(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): GetStepWeightFn {
        // Using the longest time yields a critical path exec time that is much too long for any reasonable SLO.
        // But using the cheapest exec time, works quite well.
        return getCheapestExecutionTimeForInput(Number.POSITIVE_INFINITY);

        // Using the fastest exec time also works. This allows functions earlier in the workflow to
        // take longer, while getCheapest path allows later functions in the workflow to take longer.
        // Which one is better depends on the composition and the functions of the workflow.
        // return getFastestExecutionTimeForInput(Number.POSITIVE_INFINITY);

        // return getLongestExecutionTime;
    }

}
