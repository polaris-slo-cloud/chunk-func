import { ProfilingSessionResults, ResourceProfile, WorkflowExecutionDescription, WorkflowStepDescription, WorkflowStepType, findResourceProfileResults, findResultForInput, getResourceProfileId } from '../../model';
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

    constructor(config: WorkflowStepDescription) {
        this.type = config.type;
        this.name = config.name;
        this.possibleSuccessors = config.successors;
    }

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
    maxExecutionTimeMs?: number;

    constructor(config: WorkflowStepDescription) {
        super(config);
        if (config.type !== WorkflowStepType.Function) {
            throw new Error(`Incorrect WorkflowStepType: ${this.type}`);
        }
        if (!config.profilingResults) {
            throw new Error('A WorkflowFunctionStep must have profilingResults set.');
        }
        this.profilingResults = config.profilingResults;
        this.maxExecutionTimeMs = config.maxExecutionTimeMs;
    }

    override execute(input: AccumulatedStepInput, resourceProfile: ResourceProfile | undefined, executionDescription: WorkflowExecutionDescription): StepOutput {
        const output = super.execute(input, resourceProfile, executionDescription);
        if (!resourceProfile) {
            throw new Error('resourceProfile must not be undefined for WorkflowSteps of type Function.')
        }

        const profileResults = findResourceProfileResults(resourceProfile, this.profilingResults);
        if (!profileResults || !profileResults.results) {
            throw new Error(`No Profiling results for ${getResourceProfileId(resourceProfile)}`);
        }

        const result = findResultForInput(input.totalDataSizeBytes, profileResults.results);
        output.executionTimeMs = result.executionTimeMs;
        output.cost = result.executionCost;
        return output;
    }

}

/**
 * Implementation for WorkflowSteps other than functions.
 */
export class GenericWorkflowStepImpl extends WorkflowStepBase {

    constructor(config: WorkflowStepDescription) {
        super(config);
        if (config.type === WorkflowStepType.Function) {
            throw new Error('GenericWorkflowStepImpl must not be used for WorkflowStepType.Function.');
        }
    }

}
