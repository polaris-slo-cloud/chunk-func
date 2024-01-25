
const inputSizes = [
    345600,
    518400,
    864000,
    1080000,
    1296000,
    1620000,
];

const STEPS_COUNT = 40;


function getRandomInputSize() {
    const rand = Math.random();
    const index = Math.floor(inputSizes.length * rand);
    return inputSizes[index];
}

const scenarioHeader = `
scenarioName: homogeneous-workflow-test
inputSizeBytes: ${getRandomInputSize()}

maxResponseTimeMs: {{ .sloMs }}
stepExecutions:`;

console.log(scenarioHeader);

for (let i = 0; i < STEPS_COUNT; ++i) {
    const stepOutput = `
  step-${i}:
    outputSizeBytes: ${getRandomInputSize()}`;
    console.log(stepOutput);
}
