import * as fs from 'node:fs';
import * as Yaml from 'js-yaml';
import {
    PreconfiguredConfigStrategy,
    WorkflowBuilder,
    WorkflowDescription,
    WorkflowExecutionDescription,
    buildWorkflowInput,
} from '@chunk-func/core';
import { ConfigFinder } from './slam/config-finder';
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

// console.log('Finding configs using SLAM scenario', slamExecDesc.scenarioName);
const slamInput = buildWorkflowInput(slamExecDesc);
const configFinder = new ConfigFinder(workflow);
const slamResult = configFinder.optimizeForSloAndCost(slamExecDesc.maxResponseTimeMsOverride || workflow.maxExecutionTimeMs, slamInput);
// console.log('SLAM output:', JSON.stringify(slamResult, null, 2));
// console.log('');

const evalSlo = evalExecDesc.maxResponseTimeMsOverride || workflow.maxExecutionTimeMs;
// console.log(`Simulating scenario ${evalExecDesc.scenarioName} with SLO ${evalSlo} ms.`);
const evalInput = buildWorkflowInput(evalExecDesc);
const configStrat = new PreconfiguredConfigStrategy(workflow.graph, workflow.availableResourceProfiles, slamResult.stepConfigs);
const output = workflow.execute(evalInput, configStrat);
// console.log(JSON.stringify(output, null, 2));
// console.log('SLO fulfilled:', output.executionTimeMs <= evalSlo);

const simOutput: SlamSimulatorOutput = {
    slamScenario: slamExecDesc.scenarioName,
    slamResult,
    scenarioName: evalExecDesc.scenarioName,
    inputDataSizeMib: evalExecDesc.inputSizeBytes / 1024 / 1024,
    sloMs: evalSlo,
    workflowOutput: output,
    sloFulfilled: output.executionTimeMs <= evalSlo,
}

console.log(JSON.stringify(simOutput, null, 2));
