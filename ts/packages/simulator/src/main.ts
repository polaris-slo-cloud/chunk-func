import * as fs from 'node:fs';
import * as Yaml from 'js-yaml';
import {
    ChooseConfigurationStrategyFactory,
    PickFastestConfigStrategy,
    WorkflowBuilder,
    WorkflowDescription,
    WorkflowExecutionDescription,
    WorkflowInput,
    createPickFastestConfigStrategy,
} from '@chunk-func/core';

const resourceConfigStrategies: Record<string, ChooseConfigurationStrategyFactory> = {
    [PickFastestConfigStrategy.strategyName]: createPickFastestConfigStrategy,
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

const resConfigStratFactory = resourceConfigStrategies[process.argv[4]];
if (!resConfigStratFactory) {
    console.error('Invalid ResourceConfigurationStrategy:', process.argv[4]);
    console.error('Available ResourceConfigurationStrategies:', Object.keys(resourceConfigStrategies));
    process.exit(1);
}

const workflowBuilder = new WorkflowBuilder();
const workflow = workflowBuilder.buildWorkflow(workflowDesc);

console.log('Simulating scenario', execDesc.scenarioName);
const input: WorkflowInput<any> = {
    data: {
        sizeBytes: execDesc.inputSizeBytes,
    },
    executionDescription: execDesc,
};
const resConfigStrat = resConfigStratFactory(workflow.graph, workflow.availableResourceProfiles);
const output = workflow.execute(input, resConfigStrat);
console.log(output);
