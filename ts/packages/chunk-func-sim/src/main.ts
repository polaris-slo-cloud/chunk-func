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
    ProportionalSloConfigStrategy,
    createProportionalSloConfigStrategy,
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
} from '@chunk-func/core';

const resourceConfigStrategies: Record<string, ChooseConfigurationStrategyFactory> = {
    [FastestConfigStrategy.strategyName]: createFastestConfigStrategy,
    [SlowestConfigStrategy.strategyName]: createSlowestConfigStrategy,
    [CheapestConfigStrategy.strategyName]: createCheapestConfigStrategy,
    [SloCompliantConfigStrategy.strategyName]: createSloCompliantConfigStrategy,
    [ProportionalSloConfigStrategy.strategyName]: createProportionalSloConfigStrategy,
    [ProportionalCriticalPathSloConfigStrategy.strategyName]: createProportionalCriticalPathSloConfigStrategy,
    [InputHeuristicProportionalCPSloConfigStrategy.strategyName]: createInputHeuristicProportionalCPSloConfigStrategy,
    [FixedOutputProportionalCPSloConfigStrategy.strategyName]: createFixedOutputProportionalCPSloConfigStrategy,
    [InputHeuristicSloCompliantConfigStrategy.strategyName]: createInputHeuristicSloCompliantConfigStrategy,
    [FixedOutputSloCompliantConfigStrategy.strategyName]: createFixedOutputSloCompliantConfigStrategy,
    [StepConfConfigStrategy.strategyName]: createStepConfConfigStrategy,
};

if (process.argv.length < 5) {
    console.log('Usage:');
    console.log('node main.js <workflow.yaml> <scenario.yaml> <ResourceConfigurationStrategy>');
    console.log('Available ResourceConfigurationStrategies:', Object.keys(resourceConfigStrategies));
    process.exit(1);
}

const workflowStr = fs.readFileSync(process.argv[2], { encoding: 'utf8' });
const scenarioStr = fs.readFileSync(process.argv[3], { encoding: 'utf8' });
const workflowDesc = Yaml.load(workflowStr) as WorkflowDescription;
const execDesc = Yaml.load(scenarioStr) as WorkflowExecutionDescription;

const resourceConfigStratName = process.argv[4];
const resConfigStratFactory = resourceConfigStrategies[resourceConfigStratName];
if (!resConfigStratFactory) {
    console.error('Invalid ResourceConfigurationStrategy:', resourceConfigStratName);
    console.error('Available ResourceConfigurationStrategies:', Object.keys(resourceConfigStrategies));
    process.exit(1);
}

const workflowBuilder = new WorkflowBuilder();
const workflow = workflowBuilder.buildWorkflow(workflowDesc);
const slo = execDesc.maxResponseTimeMsOverride || workflow.maxExecutionTimeMs;

let output: WorkflowOutput<unknown>;
let error: Error;

try {
    const input = buildWorkflowInput(execDesc);
    const resConfigStrat = resConfigStratFactory(workflow.graph, workflow.availableResourceProfiles);
    output = workflow.execute(input, resConfigStrat);
} catch (err) {
    output = {
        executionTimeMs: -1,
        totalCost: -1,
    } as any;
    error = err;
}

const simOutput: SimulatorOutput = {
    scenarioName: execDesc.scenarioName,
    resourceConfigStrategy: resourceConfigStratName,
    inputDataSizeMib: execDesc.inputSizeBytes / 1024 / 1024,
    sloMs: slo,
    workflowOutput: output,
    sloFulfilled: output.executionTimeMs <= slo,
};

if (error) {
    simOutput.error = error.toString();
}

console.log(JSON.stringify(simOutput, null, 2));
