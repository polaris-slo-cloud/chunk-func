import { ResourceProfile } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowGraph,
    WorkflowState,
    WorkflowFunctionStep,
    GetStepWeightFn,
    getCheapestExecutionTimeForInput,
    Workflow,
    computeStepInputSize,
} from '../workflow';
import { SloCompliantConfigStrategyBase } from './slo-compliant-config-strategy.base';

export const createFixedOutputSloCompliantConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow) => new FixedOutputSloCompliantConfigStrategy(workflow.graph, workflow.availableResourceProfiles);

/**
 * ResourceConfigurationStrategy that always picks the cheapest profile that allows fulfilling the SLO,
 * assuming that we know the output size of each step.
 */
export class FixedOutputSloCompliantConfigStrategy extends SloCompliantConfigStrategyBase {

    static readonly strategyName = 'FixedOutputSloCompliantConfigStrategy';

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        super(FixedOutputSloCompliantConfigStrategy.strategyName, graph, availableResProfiles);
    }

    protected override getCriticalPathWeightFn(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): GetStepWeightFn {
        return (currStep: WorkflowFunctionStep) => {
            const inputSize = computeStepInputSize(currStep, workflowState.executionDescription);
            const currStepWeightFn = getCheapestExecutionTimeForInput(inputSize);
            return currStepWeightFn(currStep);
        };
    }

}
