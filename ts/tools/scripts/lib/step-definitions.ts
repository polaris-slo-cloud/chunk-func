import { FunctionAndInput } from './model';
import { shortFunctionStepAws, mediumFunctionStepAws, longFunctionStepAws } from './step-definitions-aws';
import { longFunctionStepAwsBo, mediumFunctionStepAwsBo, shortFunctionStepAwsBo } from './step-definitions-aws-bo';
import { shortFunctionStepGcf, mediumFunctionStepGcf, longFunctionStepGcf } from './step-definitions-gcf';

export const shortFunctionInputs = [
    345600,
    518400,
    864000,
    1080000,
    1296000,
    1620000,
];

export const mediumFunctionInputs = [
    345600,
    518400,
    864000,
    1080000,
    1296000,
    1620000,
];

export const longFunctionInputs = [
    2168077,
    2200720,
    6462780,
    6478567,
    14938139,
    15033099,
];

export const functionsAndInputsGcf: FunctionAndInput[] = [
    { functionStep: shortFunctionStepGcf, inputs: shortFunctionInputs },
    { functionStep: mediumFunctionStepGcf, inputs: mediumFunctionInputs },
    { functionStep: longFunctionStepGcf, inputs: longFunctionInputs },
];

export const functionsAndInputsAws: FunctionAndInput[] = [
    { functionStep: shortFunctionStepAws, inputs: shortFunctionInputs },
    { functionStep: mediumFunctionStepAws, inputs: mediumFunctionInputs },
    { functionStep: longFunctionStepAws, inputs: longFunctionInputs },
];

export const functionsAndInputsAwsBo: FunctionAndInput[] = [
    { functionStep: shortFunctionStepAwsBo, inputs: shortFunctionInputs },
    { functionStep: mediumFunctionStepAwsBo, inputs: mediumFunctionInputs },
    { functionStep: longFunctionStepAwsBo, inputs: longFunctionInputs },
];

export const SHORT_STEP_INDEX = 0;
export const MEDIUM_STEP_INDEX = 1;
export const LONG_STEP_INDEX = 2;
