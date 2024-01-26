import { WorkflowDescription, WorkflowExecutionDescription } from '@chunk-func/core';
import { cloneDeep } from 'lodash';
import { InputRangeSlicerFn, WorkflowAndPossibleInputs, WorkflowGenerationPlan } from './model';
import { getMedianInputSize, getScenarioName, getStepName, pickRandomItem } from './util';
import { workflowHeader } from './workflow-generation-plans';

type PickOutputSizeFn = (inputs: number[]) => number;

export function generateWorkflow(plan: WorkflowGenerationPlan): WorkflowAndPossibleInputs {
    const possibleStepInputs: Record<string, number[]> = {};
    const workflow: WorkflowDescription = cloneDeep(workflowHeader);

    let currStepIndex = 0;
    for (const sequence of plan) {
        for (let i = 0; i < sequence.stepsCount; ++i) {
            const funcAndInputs = pickRandomItem(sequence.functionsAndInputs);
            const step = cloneDeep(funcAndInputs.functionStep);
            const stepName = getStepName(currStepIndex);
            step.name = stepName;
            step.successors = [ getStepName(currStepIndex + 1) ];
            workflow.steps.push(step);
            possibleStepInputs[stepName] = funcAndInputs.inputs;
            ++currStepIndex;
        }
    }

    workflow.startStep = workflow.steps[0].name;
    const endStep = workflow.steps[workflow.steps.length - 1];
    workflow.endStep = endStep.name
    endStep.successors = undefined;

    return { workflow, possibleStepInputs };
}

function generateScenarioInternal(scenarioName: string, workflow: WorkflowAndPossibleInputs, sloMs: number, pickOutputSizeFn: PickOutputSizeFn): WorkflowExecutionDescription {
    const possibleInputs = workflow.possibleStepInputs;

    const scenario: WorkflowExecutionDescription = {
        scenarioName: scenarioName,
        inputSizeBytes: pickOutputSizeFn(possibleInputs[workflow.workflow.steps[0].name]),
        maxResponseTimeMs: sloMs,
        stepExecutions: {},
    };

    let nextStepIndex = 1;
    for (const currStep of workflow.workflow.steps) {
        let outputSizeBytes = 1;
        if (nextStepIndex < workflow.workflow.steps.length) {
            const nextStep = workflow.workflow.steps[nextStepIndex];
            outputSizeBytes = pickOutputSizeFn(possibleInputs[nextStep.name]);
        }
        scenario.stepExecutions[currStep.name] = {
            outputSizeBytes,
        };
        ++nextStepIndex;
    }

    return scenario;
}

function buildOutputSizePickerFn(inputRangeSlicer: InputRangeSlicerFn, pickOutputSize: PickOutputSizeFn): PickOutputSizeFn {
    return (inputs) => {
        const slicedInputs = inputRangeSlicer(inputs);
        return pickOutputSize(slicedInputs);
    };
}

export function generateScenario(scenarioName: string, workflow: WorkflowAndPossibleInputs, inputRangeSlicer: InputRangeSlicerFn, sloMs: number): WorkflowExecutionDescription {
    const outputPicker = buildOutputSizePickerFn(inputRangeSlicer, pickRandomItem);
    return generateScenarioInternal(scenarioName, workflow, sloMs, outputPicker);
}

export function generateSlamTrainingScenario(workflow: WorkflowAndPossibleInputs): WorkflowExecutionDescription {
    // For the SLAM training scenario we don't need to slice the inputs, because we always use the median of the full range.
    return generateScenarioInternal('slam-scenario', workflow, 1000, getMedianInputSize);
}

export function generateScenarios(workflow: WorkflowAndPossibleInputs, inputRangeSlicers: InputRangeSlicerFn[]): WorkflowExecutionDescription[] {
    const scenarios = inputRangeSlicers.map((slicer, index) => {
        const scenarioName = getScenarioName(index);
        return generateScenario(scenarioName, workflow, slicer, 1000);
    });
    return scenarios;
}
