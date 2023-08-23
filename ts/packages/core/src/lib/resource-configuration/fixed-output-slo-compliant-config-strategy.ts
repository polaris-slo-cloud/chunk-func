import { ResourceProfile, WorkflowExecutionDescription } from '../model';
import {
    AccumulatedStepInput,
    ChooseConfigurationStrategyFactory,
    WorkflowGraph,
    WorkflowState,
    WorkflowFunctionStep,
    GetStepWeightFn,
    getCheapestExecutionTimeForInput,
} from '../workflow';
import { SloCompliantConfigStrategyBase } from './slo-compliant-config-strategy.base';

export const createFixedOutputSloCompliantConfigStrategy: ChooseConfigurationStrategyFactory =
    (graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) => new FixedOutputSloCompliantConfigStrategy(graph, availableResProfiles);

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
            const inputSize = this.computeStepInputSize(currStep, workflowState.executionDescription);
            const currStepWeightFn = getCheapestExecutionTimeForInput(inputSize);
            return currStepWeightFn(currStep);
        };
    }

    private computeStepInputSize(step: WorkflowFunctionStep, executionDescription: WorkflowExecutionDescription): number {
        if (!step.requiredInputs) {
            return 0;
        }

        let inputSize = 0;
        for (const stepName of step.requiredInputs) {
            const stepExec = executionDescription.stepExecutions[stepName];
            inputSize += stepExec.outputSizeBytes;
        }

        return inputSize;
    }

}
