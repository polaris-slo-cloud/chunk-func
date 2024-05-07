import * as fs from 'node:fs';
import * as Yaml from 'js-yaml';
import {
    ChooseConfigurationStrategyFactory,
    CheapestConfigStrategy,
    FastestConfigStrategy,
    SlowestConfigStrategy,
    WorkflowBuilder,
    WorkflowDescription,
    WorkflowExecutionDescription,
    createCheapestConfigStrategy,
    createFastestConfigStrategy,
    createSlowestConfigStrategy,
    SloCompliantConfigStrategy,
    createSloCompliantConfigStrategy,
    InputHeuristicSloCompliantConfigStrategy,
    createInputHeuristicSloCompliantConfigStrategy,
    FixedOutputSloCompliantConfigStrategy,
    createFixedOutputSloCompliantConfigStrategy,
    buildWorkflowInput,
    StepConfConfigStrategy,
    createStepConfConfigStrategy,
    ProportionalCriticalPathSloConfigStrategy,
    createProportionalCriticalPathSloConfigStrategy,
    SimulatorOutput,
    InputHeuristicProportionalCPSloConfigStrategy,
    createInputHeuristicProportionalCPSloConfigStrategy,
    FixedOutputProportionalCPSloConfigStrategy,
    createFixedOutputProportionalCPSloConfigStrategy,
    WorkflowOutput,
    SlamConfigStrategy,
    createSlamConfigStrategy,
    OnlineSlamConfigStrategy,
    createOnlineSlamConfigStrategy,
    SpreadSearchConfigStrategy,
    createSpreadSearchConfigStrategy,
    HybridSearchConfigStrategy,
    createHybridSearchConfigStrategy,
    initSlo,
} from '@chunk-func/core';
import { convertArgsToOptions } from './util';

const resourceConfigStrategies: Record<string, ChooseConfigurationStrategyFactory> = {
    [FastestConfigStrategy.strategyName]: createFastestConfigStrategy,
    [SlowestConfigStrategy.strategyName]: createSlowestConfigStrategy,
    [CheapestConfigStrategy.strategyName]: createCheapestConfigStrategy,
    [SloCompliantConfigStrategy.strategyName]: createSloCompliantConfigStrategy,
    [ProportionalCriticalPathSloConfigStrategy.strategyName]: createProportionalCriticalPathSloConfigStrategy,
    [InputHeuristicProportionalCPSloConfigStrategy.strategyName]: createInputHeuristicProportionalCPSloConfigStrategy,
    [FixedOutputProportionalCPSloConfigStrategy.strategyName]: createFixedOutputProportionalCPSloConfigStrategy,
    [InputHeuristicSloCompliantConfigStrategy.strategyName]: createInputHeuristicSloCompliantConfigStrategy,
    [FixedOutputSloCompliantConfigStrategy.strategyName]: createFixedOutputSloCompliantConfigStrategy,
    [StepConfConfigStrategy.strategyName]: createStepConfConfigStrategy,
    [SlamConfigStrategy.strategyName]: createSlamConfigStrategy,
    [OnlineSlamConfigStrategy.strategyName]: createOnlineSlamConfigStrategy,
    [SpreadSearchConfigStrategy.strategyName]: createSpreadSearchConfigStrategy,
    [HybridSearchConfigStrategy.strategyName]: createHybridSearchConfigStrategy,
};

if (process.argv.length < 5) {
    console.log('Usage:');
    console.log('node main.js <workflow.yaml> <scenario.yaml> <ResourceConfigurationStrategy> (<training-scenario.yaml>)');
    console.log('Available ResourceConfigurationStrategies:', Object.keys(resourceConfigStrategies));
    process.exit(1);
}

function loadYamlFile<T>(path: string): T {
    const contents = fs.readFileSync(path, { encoding: 'utf8' });
    return Yaml.load(contents) as T;
}

const workflowDesc = loadYamlFile<WorkflowDescription>(process.argv[2]);
const execDesc =  loadYamlFile<WorkflowExecutionDescription>(process.argv[3]);

let optionsStartIndex = 5;
let trainingScenarioDesc: WorkflowExecutionDescription | undefined;
if (process.argv[5]) {
    if (!process.argv[5].startsWith('--')) {
        trainingScenarioDesc = loadYamlFile<WorkflowExecutionDescription>(process.argv[5]);
        ++optionsStartIndex;
    }
}

const resourceConfigStratName = process.argv[4];
const resConfigStratFactory = resourceConfigStrategies[resourceConfigStratName];
if (!resConfigStratFactory) {
    console.error('Invalid ResourceConfigurationStrategy:', resourceConfigStratName);
    console.error('Available ResourceConfigurationStrategies:', Object.keys(resourceConfigStrategies));
    process.exit(1);
}
const resConfigOptions = convertArgsToOptions(process.argv.slice(optionsStartIndex));

const workflowBuilder = new WorkflowBuilder();
const workflow = workflowBuilder.buildWorkflow(workflowDesc);

let strategyTrainingOutput: any;
let output: WorkflowOutput<unknown>;
let error: Error;

try {
    const resConfigStrat = resConfigStratFactory(workflow, resConfigOptions);

    if (resConfigStrat.train) {
        if (!trainingScenarioDesc) {
            throw new Error(`${resConfigStrat.name} requires a training-scenario.yaml to be specified as the last argument.`);
        }
        const trainingInput = buildWorkflowInput(trainingScenarioDesc);
        trainingInput.executionDescription.sloLimit = execDesc.sloLimit;
        trainingInput.executionDescription.sloType = execDesc.sloType;
        trainingInput.executionDescription.maxResponseTimeMs = execDesc.maxResponseTimeMs;
        const trainingSlo = initSlo(trainingInput.executionDescription);
        strategyTrainingOutput = resConfigStrat.train(trainingSlo, trainingInput);
    }

    const input = buildWorkflowInput(execDesc);
    output = workflow.execute(input, resConfigStrat);
} catch (err) {
    output = {
        executionTimeMs: -1,
        executionCost: -1,
    } as WorkflowOutput<unknown>;
    error = err;
}

const simOutput: SimulatorOutput = {
    scenarioName: execDesc.scenarioName,
    resourceConfigStrategy: resourceConfigStratName,
    inputDataSizeMib: execDesc.inputSizeBytes / 1024 / 1024,
    sloMs: execDesc.sloLimit || execDesc.maxResponseTimeMs,
    strategyTrainingOutput,
    workflowOutput: output,
    sloFulfilled: output.sloFulfilled,
};

if (error) {
    simOutput.error = error.toString();
}

console.log(JSON.stringify(simOutput, null, 2));
