import * as fs from 'node:fs';
import * as seedrandom from 'seedrandom';
import { FunctionAndInput, InputRangeSlicerFn } from './model';

// Reproducible random numbers.
const random = seedrandom('chunk-func');

// Non-reproducible random numbers;
// const random = seedrandom();

export const getAllInputs: InputRangeSlicerFn = (inputs: number[]) => inputs;

export const getSmallInputsOnly: InputRangeSlicerFn = (inputs: number[]) => {
    const oneThird = Math.round(inputs.length / 3);
    const lowerBound = 0;
    const upperBound = oneThird;
    return inputs.slice(lowerBound, upperBound);
}

export const getMediumInputsOnly: InputRangeSlicerFn = (inputs: number[]) => {
    const oneThird = Math.round(inputs.length / 3);
    const lowerBound = oneThird;
    const upperBound = inputs.length - oneThird;
    return inputs.slice(lowerBound, upperBound);
}

export const getLargeInputsOnly: InputRangeSlicerFn = (inputs: number[]) => {
    const oneThird = Math.round(inputs.length / 3);
    const lowerBound = inputs.length - oneThird;
    const upperBound = inputs.length;
    return inputs.slice(lowerBound, upperBound);
}

export function getFunctionsAndInputsForSizes(funcsAndInputs: FunctionAndInput[], inputsExtractor: (inputs: number[]) => number[]): FunctionAndInput[] {
    const ret: FunctionAndInput[] = funcsAndInputs.map(f => ({
        functionStep: f.functionStep,
        inputs: inputsExtractor(f.inputs),
    }));
    return ret;
}

export function getMedianInputSize(inputs: number[]): number {
    const center = (inputs.length - 1) / 2;
    if (center % 2 === 0) {
        return inputs[center];
    }
    const lower = Math.floor(center);
    const sum = inputs[lower] + inputs[lower + 1];
    return Math.round(sum / 2);
}

export function pickRandomItem<T>(items: T[]): T {
    const r = random();
    const index = Math.floor(r * items.length);
    return items[index];
}

export function getStepName(index: number): string {
    return `step-${index}`;
}

export function getScenarioName(index: number): string {
    const id = (index + 1).toString();
    return `scenario-${id.padStart(2, '0')}`;
}

export function extractOutDirFromArgs(expectedIndex: number): string | undefined {
    if (process.argv.length > expectedIndex) {
        let dirStr = process.argv[expectedIndex];
        if (dirStr === 'ts-node') {
            if (process.argv.length > expectedIndex + 1) {
                dirStr = process.argv[expectedIndex + 1];
            } else {
                return undefined;
            }
        }
        try {
            fs.opendirSync(dirStr);
            return dirStr;
        } catch(ex) {}
    }

    return undefined;
}

export function extractProfilesTypeFromArgs(expectedIndex: number): string | undefined {
    if (process.argv.length > expectedIndex) {
        return process.argv[expectedIndex];
    }

    return undefined;
}
