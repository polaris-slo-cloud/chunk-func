import { ResourceProfile } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowGraph,
    WorkflowState,
    WorkflowFunctionStep,
    GetStepWeightFn,
    getLongestExecutionTime,
} from '../workflow';
import { SloCompliantConfigStrategyBase } from './slo-compliant-config-strategy.base';

export const createSloCompliantConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new SloCompliantConfigStrategy(graph, availableResProfiles);

/**
 * ResourceConfigurationStrategy that always picks the cheapest profile that allows fulfilling the SLO.
 */
export class SloCompliantConfigStrategy extends SloCompliantConfigStrategyBase {

    static readonly strategyName = 'SloCompliantConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(SloCompliantConfigStrategy.strategyName, graph, availableResProfiles);
    }

    protected override getCriticalPathWeightFn(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): GetStepWeightFn {
        return getLongestExecutionTime;
    }

}
