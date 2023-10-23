import * as fs from 'node:fs';
import * as Yaml from 'js-yaml';
import {
    PreconfiguredConfigStrategy,
    WorkflowBuilder,
    WorkflowDescription,
    WorkflowExecutionDescription,
    WorkflowOutput,
    buildWorkflowInput,
} from '@chunk-func/core';
import { ConfigFinder, SlamOutput } from './slam/config-finder';
import { SlamSimulatorOutput } from './slam/slam-simulator-output';


if (process.argv.length < 5) {
    console.log('Usage:');
    console.log('node main.js <workflow.yaml> <slam-scenario.yaml> <eval-scenario.yaml>');
    console.log('\nThe SLAM scenario (with median input sizes) is used for determining the resource profile configs and the eval-scenario is used for the actual evaluation.');
    process.exit(1);
}

const workflowStr = fs.readFileSync(process.argv[2], { encoding: 'utf8' });
const slamScenarioStr = fs.readFileSync(process.argv[3], { encoding: 'utf8' });
const evalScenarioStr = fs.readFileSync(process.argv[4], { encoding: 'utf8' });
const workflowDesc = Yaml.load(workflowStr) as WorkflowDescription;
const slamExecDesc = Yaml.load(slamScenarioStr) as WorkflowExecutionDescription;
const evalExecDesc = Yaml.load(evalScenarioStr) as WorkflowExecutionDescription;

const workflowBuilder = new WorkflowBuilder();
const workflow = workflowBuilder.buildWorkflow(workflowDesc);
const evalSlo = evalExecDesc.maxResponseTimeMsOverride || workflow.maxExecutionTimeMs;

const slamInput = buildWorkflowInput(slamExecDesc);
const configFinder = new ConfigFinder(workflow);

let slamResult: SlamOutput;
let output: WorkflowOutput<unknown>;
let error: Error;

try {
    // To realistically compare to the other approaches we need to use the eval SLO with the SLAM profiling data.
    slamResult = configFinder.optimizeForSloAndCost(evalSlo, slamInput);

    const evalInput = buildWorkflowInput(evalExecDesc);
    const configStrat = new PreconfiguredConfigStrategy(workflow.graph, workflow.availableResourceProfiles, slamResult.stepConfigs);
    output = workflow.execute(evalInput, configStrat);
} catch (err) {
    output = {
        executionTimeMs: -1,
        totalCost: -1,
    } as any;
    error = err;
}

const simOutput: SlamSimulatorOutput = {
    slamScenario: slamExecDesc.scenarioName,
    slamResult,
    resourceConfigStrategy: 'SLAM',
    scenarioName: evalExecDesc.scenarioName,
    inputDataSizeMib: evalExecDesc.inputSizeBytes / 1024 / 1024,
    sloMs: evalSlo,
    workflowOutput: output,
    sloFulfilled: output.executionTimeMs > 0 && output.executionTimeMs <= evalSlo,
};
if (error) {
    simOutput.error = error.toString();
}

console.log(JSON.stringify(simOutput, null, 2));
