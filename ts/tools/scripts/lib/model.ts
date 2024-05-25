import { WorkflowDescription, WorkflowStepDescription } from '@chunk-func/core';

export interface FunctionAndInput {
    functionStep:  WorkflowStepDescription;
    inputs: number[];
}

/** Returns a subsection of the possible inputs to generate scenarios to use, e.g., only large inputs. */
export type InputRangeSlicerFn = (inputs: number[]) => number[];

/** Defines how a sequence of steps should be generated. */
export interface StepSequenceDefinition {
    /**
     * The functions and inputs that may be used for the sequence.
     *
     * For each step, a random function and input will be chosen.
     */
    functionsAndInputs: FunctionAndInput[];

    stepsCount: number;
}

export type WorkflowGenerationPlan = StepSequenceDefinition[];

export interface WorkflowAndPossibleInputs {
    workflow: WorkflowDescription;
    possibleStepInputs: Record<string, number[]>;
}
