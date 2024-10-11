import { cloneDeep } from 'lodash';
import { ProfilingResult, ProfilingSessionResults, ResourceProfile, WorkflowExecutionDescription, WorkflowStepDescription, WorkflowStepType, findResourceProfileResults, findResultForInput, getResourceProfileId } from '../../model';
import { AccumulatedStepInput, StepOutput, WorkflowFunctionStep, WorkflowStep } from '../step';

/**
 * Abstract base class for WorkflowStep implementations.
 *
 * execute() simply returns the output size defined in the executionDescription and all possibleSuccessors,
 * with zero execution time and cost.
 */
export abstract class WorkflowStepBase implements WorkflowStep {

    readonly type: WorkflowStepType;
    name: string;
    requiredInputs?: string[];
    possibleSuccessors?: string[];

    constructor (config: WorkflowStepDescription);
    constructor(cloneSrc: WorkflowStepBase);
    constructor(config: WorkflowStepDescription | WorkflowStepBase) {
        this.type = config.type;
        this.name = config.name;

        if (config instanceof WorkflowStepBase) {
            this.possibleSuccessors = cloneDeep(config.possibleSuccessors);
            this.requiredInputs = cloneDeep(config.requiredInputs);
        } else {
            this.possibleSuccessors = config.successors;
        }
    }

    abstract clone(): WorkflowStep;

    execute(input: AccumulatedStepInput, resourceProfile: ResourceProfile | undefined, executionDescription: WorkflowExecutionDescription): StepOutput {
        const stepExecDesc = executionDescription.stepExecutions[this.name];
        const output: StepOutput = {
            cost: 0,
            executionTimeMs: 0,
            data: {
                sizeBytes: stepExecDesc.outputSizeBytes,
            }
        };
        if (this.possibleSuccessors) {
            output.nextSteps = [ ...this.possibleSuccessors ];
        }
        return output;
    }

}

/**
 * Implementation for WorkflowFunctionStep.
 */
export class WorkflowFunctionStepImpl extends WorkflowStepBase implements WorkflowFunctionStep {

    override readonly type: WorkflowStepType.Function = WorkflowStepType.Function;
    profilingResults: ProfilingSessionResults;
    exhaustiveProfilingResults: ProfilingSessionResults;
    maxExecutionTimeMs?: number;

    constructor (config: WorkflowStepDescription);
    constructor(cloneSrc: WorkflowFunctionStepImpl);
    constructor(config: WorkflowStepDescription | WorkflowFunctionStepImpl) {
        super(config);
        if (config.type !== WorkflowStepType.Function) {
            throw new Error(`Incorrect WorkflowStepType: ${this.type}`);
        }
        if (!config.profilingResults) {
            throw new Error('A WorkflowFunctionStep must have profilingResults set.');
        }
        if (config instanceof WorkflowFunctionStepImpl) {
            this.profilingResults = cloneDeep(config.profilingResults);
            this.exhaustiveProfilingResults = cloneDeep(config.exhaustiveProfilingResults);
        } else {
            this.profilingResults = config.profilingResults;
            this.exhaustiveProfilingResults = config.exhaustiveProfilingResults || cloneDeep(config.profilingResults);
        }
        this.maxExecutionTimeMs = config.maxExecutionTimeMs;
    }

    override execute(input: AccumulatedStepInput, resourceProfile: ResourceProfile | undefined, executionDescription: WorkflowExecutionDescription): StepOutput {
        const output = super.execute(input, resourceProfile, executionDescription);
        if (!resourceProfile) {
            throw new Error('resourceProfile must not be undefined for WorkflowSteps of type Function.')
        }

        if (!this.exhaustiveProfilingResults.profiledInputSizes) {
            throw new Error('exhaustiveProfilingResults.profiledInputSizes is not set.')
        }

        const profileResults = findResourceProfileResults(resourceProfile, this.exhaustiveProfilingResults);
        if (!profileResults || !profileResults.results) {
            throw new Error(`No Profiling results for ${getResourceProfileId(resourceProfile)}`);
        }

        let result = findResultForInput(input.totalDataSizeBytes, this.exhaustiveProfilingResults.profiledInputSizes, profileResults.results);
        if (!result && this.profilingResults.configurationsInferred) {
            // For partially inferred profiling results we allow switching to the next higher successful profile.
            result = this.findNextHigherProfilingResult(input, resourceProfile);
        }
        if (!result) {
            throw new Error(`ResourceProfile ${getResourceProfileId(resourceProfile)}MiB does not contain a successful profiling result for input ${input.totalDataSizeBytes}.`);
        }
        output.executionTimeMs = result.executionTimeMs;
        output.cost = result.executionCost;
        return output;
    }

    override clone(): WorkflowStep {
        return new WorkflowFunctionStepImpl(this);
    }

    protected findNextHigherProfilingResult(input: AccumulatedStepInput, minResourceProfile: ResourceProfile): ProfilingResult | undefined {
        if (!this.exhaustiveProfilingResults.profiledInputSizes) {
            throw new Error('exhaustiveProfilingResults.profiledInputSizes is not set.')
        }

        const minProfileId = getResourceProfileId(minResourceProfile);
        let foundMin = false;
        for (const currResults of this.exhaustiveProfilingResults.results) {
            if (!foundMin) {
                foundMin = currResults.resourceProfileId === minProfileId;
                if (!foundMin) {
                    continue;
                }
            }

            if (currResults.results) {
                const result = findResultForInput(input.totalDataSizeBytes, this.exhaustiveProfilingResults.profiledInputSizes, currResults.results);
                if (result) {
                    return result;
                }
            }
        }

        return undefined;
    }

}

/**
 * Implementation for WorkflowSteps other than functions.
 */
export class GenericWorkflowStepImpl extends WorkflowStepBase {

    constructor (config: WorkflowStepDescription);
    constructor(cloneSrc: GenericWorkflowStepImpl);
    constructor(config: WorkflowStepDescription | GenericWorkflowStepImpl) {
        super(config);
        if (config.type === WorkflowStepType.Function) {
            throw new Error('GenericWorkflowStepImpl must not be used for WorkflowStepType.Function.');
        }
    }

    override clone(): WorkflowStep {
        return new GenericWorkflowStepImpl(this);
    }

}
