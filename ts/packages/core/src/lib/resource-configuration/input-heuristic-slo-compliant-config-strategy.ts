import { ResourceProfile } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowGraph,
    WorkflowState,
    WorkflowFunctionStep,
    GetStepWeightFn,
    getLongestExecutionTimeForInput,
    getCheapestExecutionTimeForInput,
    Workflow,
} from '../workflow';
import { SloCompliantConfigStrategyBase } from './slo-compliant-config-strategy.base';

export const createInputHeuristicSloCompliantConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new InputHeuristicSloCompliantConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that always picks the cheapest profile that allows fulfilling the SLO,
 * assuming that the size of the output of the current step is less or equal to its input size.
 */
export class InputHeuristicSloCompliantConfigStrategy extends SloCompliantConfigStrategyBase {

    static readonly strategyName = 'InputHeuristicSloCompliantConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(InputHeuristicSloCompliantConfigStrategy.strategyName, graph, availableResProfiles);
    }

    protected override getCriticalPathWeightFn(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): GetStepWeightFn {
        // Using the longest time yields a critical path exec time that is much too long for any reasonable SLO.
        // But using the cheapest exec time for the input size, works quite well.
        return getCheapestExecutionTimeForInput(input.totalDataSizeBytes);

        // return getLongestExecutionTimeForInput(input.totalDataSizeBytes);
    }

}
