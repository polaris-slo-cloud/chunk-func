import * as Yaml from 'js-yaml';
import * as fs from 'node:fs';
import { exit } from 'node:process';
import {
    FunctionAndInput,
    InputRangeSlicerFn,
    LONG_STEP_INDEX,
    MEDIUM_STEP_INDEX,
    SHORT_STEP_INDEX,
    WorkflowGenerationPlan,
    extractOutDirFromArgs,
    extractProfilesTypeFromArgs,
    functionsAndInputsAws,
    functionsAndInputsAwsBo,
    functionsAndInputsGcf,
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

const functionsAndInputsByProfiles: Record<string, FunctionAndInput[]> = {
    'gcf': functionsAndInputsGcf,
    'aws': functionsAndInputsAws,
    'aws-bo': functionsAndInputsAwsBo,
};

function getWorkflowGenerationPlan(functionsAndInputs: FunctionAndInput[]): WorkflowGenerationPlan {
    // Homogeneous workflow.
    return getHomogeneousWorkflowPlan(40, functionsAndInputs[MEDIUM_STEP_INDEX]);

    // Long-short workflow.
    // return getHalfHalfWorkflowPlan(20, functionsAndInputs[MEDIUM_STEP_INDEX], functionsAndInputs[SHORT_STEP_INDEX]);

    // High resources - low resources workflow.
    // return getHalfHalfWorkflowPlan(20, functionsAndInputs[LONG_STEP_INDEX], functionsAndInputs[SHORT_STEP_INDEX]);

    // Short-long workflow.
    // return getHalfHalfWorkflowPlan(20, functionsAndInputs[SHORT_STEP_INDEX], functionsAndInputs[MEDIUM_STEP_INDEX]);

    // Low resources - high resources workflow.
    // return getHalfHalfWorkflowPlan(20, functionsAndInputs[SHORT_STEP_INDEX], functionsAndInputs[LONG_STEP_INDEX]);

    // Cyclic workflow.
    // return getCyclicWorkflowPlan(14, functionsAndInputs);

    // Staircase workflow.
    // return getStaircaseWorkflowPlan(14, functionsAndInputs);

    // Random workflow.
    // return [ { functionsAndInputs: functionsAndInputs, stepsCount: 40 } ];
}

const SCENARIO_INPUT_RANGES: InputRangeSlicerFn[] = [
    getLargeInputsOnly,
    getMediumInputsOnly,
    getSmallInputsOnly,
];

function generateWorkflowAndScenario(plan: WorkflowGenerationPlan, scenarioPlans: InputRangeSlicerFn[], outDir: string, resProfilesType: string): void {
    console.log('Generating workflow');
    const workflow = generateWorkflow(plan, resProfilesType);
    const scenarios = generateScenarios(workflow, scenarioPlans);
    const slamScenario = generateSlamTrainingScenario(workflow);

    const workflowFilePath = `${outDir}/workflow-${resProfilesType}.yaml`;
    console.log(`Writing workflow to ${workflowFilePath}`);
    const workflowYaml = Yaml.dump(workflow.workflow);
    fs.writeFileSync(workflowFilePath, workflowYaml, { encoding: 'utf-8' });

    for (const scenario of scenarios) {
        const scenarioYaml = Yaml.dump(scenario);
        const filenameBase = `${outDir}/${scenario.scenarioName}`;

        console.log(`Writing scenario to ${filenameBase}.yaml`);
        fs.writeFileSync(filenameBase + '.yaml', scenarioYaml, { encoding: 'utf-8' });

        console.log(`Writing scenario template to ${filenameBase}-template.yaml`);
        let scenarioTemplateYaml = scenarioYaml.replace('sloType: "MaxExecutionTime"', 'sloType: {{ .sloType }}');
        scenarioTemplateYaml = scenarioTemplateYaml.replace('sloLimit: 1000', 'sloLimit: {{ .sloLimit }}');
        fs.writeFileSync(filenameBase + '-template.yaml', scenarioTemplateYaml, { encoding: 'utf-8' });
    }

    console.log(`Writing SLAM training scenario to ${outDir}/slam-scenario.yaml`);
    const slamScenarioYaml = Yaml.dump(slamScenario);
    fs.writeFileSync(`${outDir}/slam-scenario.yaml`, slamScenarioYaml, { encoding: 'utf-8' });
}

const outDir = extractOutDirFromArgs(2);
const resProfilesType = extractProfilesTypeFromArgs(3);
if (!outDir || !resProfilesType) {
    console.log('Usage: npx ts-node generate-workflow.ts <output-dir> <gcf|aws|aws-bo>');
    exit(1);
}
const functionsAndInputs = functionsAndInputsByProfiles[resProfilesType];
if (!functionsAndInputs) {
    console.log(`Incorrect resource profiles type ${resProfilesType}. Allowed types are 'gcf', 'aws', and 'aws-bo'.`)
    exit(1);
}
const wfGenerationPlan = getWorkflowGenerationPlan(functionsAndInputs);
generateWorkflowAndScenario(wfGenerationPlan, SCENARIO_INPUT_RANGES, outDir, resProfilesType);
