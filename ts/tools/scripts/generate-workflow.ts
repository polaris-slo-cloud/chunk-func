import * as Yaml from 'js-yaml';
import * as fs from 'node:fs';
import { exit } from 'node:process';
import {
    InputRangeSlicerFn,
    MEDIUM_STEP_INDEX,
    SHORT_STEP_INDEX,
    WorkflowGenerationPlan,
    extractOutDirFromArgs,
    functionsAndInputs,
    generateScenarios,
    generateSlamTrainingScenario,
    generateWorkflow,
    getCyclicWorkflowPlan,
    getHalfHalfWorkflowPlan,
    getHomogeneousWorkflowPlan,
    getLargeInputsOnly,
    getMediumInputsOnly,
    getSmallInputsOnly,
    getStaircaseWorkflowPlan,
} from './lib';

// Homogeneous workflow.
const WORKFLOW_GENERATION_PLAN: WorkflowGenerationPlan = getHomogeneousWorkflowPlan(40, functionsAndInputs[MEDIUM_STEP_INDEX]);

// Long-short workflow.
// const WORKFLOW_GENERATION_PLAN: WorkflowGenerationPlan = getHalfHalfWorkflowPlan(20, functionsAndInputs[MEDIUM_STEP_INDEX], functionsAndInputs[SHORT_STEP_INDEX]);

// Short-long workflow.
// const WORKFLOW_GENERATION_PLAN: WorkflowGenerationPlan = getHalfHalfWorkflowPlan(20, functionsAndInputs[SHORT_STEP_INDEX], functionsAndInputs[MEDIUM_STEP_INDEX]);

// Cyclic workflow.
// const WORKFLOW_GENERATION_PLAN: WorkflowGenerationPlan = getCyclicWorkflowPlan(14, functionsAndInputs);

// Staircase workflow.
// const WORKFLOW_GENERATION_PLAN: WorkflowGenerationPlan = getStaircaseWorkflowPlan(14, functionsAndInputs);

const SCENARIO_INPUT_RANGES: InputRangeSlicerFn[] = [
    getLargeInputsOnly,
    getMediumInputsOnly,
    getSmallInputsOnly,
];

function generateWorkflowAndScenario(plan: WorkflowGenerationPlan, scenarioPlans: InputRangeSlicerFn[], outDir: string): void {
    console.log('Generating workflow');
    const workflow = generateWorkflow(plan);
    const scenarios = generateScenarios(workflow, scenarioPlans);
    const slamScenario = generateSlamTrainingScenario(workflow);


    console.log(`Writing workflow to ${outDir}/workflow.yaml`);
    const workflowYaml = Yaml.dump(workflow.workflow);
    fs.writeFileSync(`${outDir}/workflow.yaml`, workflowYaml, { encoding: 'utf-8' });

    for (const scenario of scenarios) {
        const scenarioYaml = Yaml.dump(scenario);
        const filenameBase = `${outDir}/${scenario.scenarioName}`;

        console.log(`Writing scenario to ${filenameBase}.yaml`);
        fs.writeFileSync(filenameBase + '.yaml', scenarioYaml, { encoding: 'utf-8' });

        console.log(`Writing scenario template to ${filenameBase}-template.yaml`);
        const scenarioTemplateYaml = scenarioYaml.replace('maxResponseTimeMs: 1000', 'maxResponseTimeMs: {{ .sloMs }}');
        fs.writeFileSync(filenameBase + '-template.yaml', scenarioTemplateYaml, { encoding: 'utf-8' });
    }

    console.log(`Writing SLAM training scenario to ${outDir}/slam-scenario.yaml`);
    const slamScenarioYaml = Yaml.dump(slamScenario);
    fs.writeFileSync(`${outDir}/slam-scenario.yaml`, slamScenarioYaml, { encoding: 'utf-8' });
}

const outDir = extractOutDirFromArgs(2);
if (!outDir) {
    console.log('Usage: npx ts-node generate-workflow.ts <output-dir>');
    exit(1);
}
generateWorkflowAndScenario(WORKFLOW_GENERATION_PLAN, SCENARIO_INPUT_RANGES, outDir);
