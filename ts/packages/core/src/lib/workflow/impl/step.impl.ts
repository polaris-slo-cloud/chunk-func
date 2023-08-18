import { ProfilingSessionResults, ResourceProfile, WorkflowExecutionDescription, WorkflowStepDescription, findResourceProfileResults, findResultForInput, getResourceProfileId } from '../../model';
import { AccumulatedStepInput, StepOutput, WorkflowStep } from '../step';

export class WorkflowStepImpl implements WorkflowStep {

    name: string;
    requiredInputs?: string[];
    possibleSuccessors?: string[];
    profilingResults?: ProfilingSessionResults;
    maxExecutionTimeMs?: number;

    constructor(config: WorkflowStepDescription) {
        this.name = config.name;
        this.possibleSuccessors = config.successors;
        this.profilingResults = config.profilingResults;
        this.maxExecutionTimeMs = config.maxExecutionTimeMs;
    }

    execute(input: AccumulatedStepInput, resourceProfile: ResourceProfile, executionDescription: WorkflowExecutionDescription): StepOutput {
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

        if (!this.profilingResults) {
            return output;
        }

        const profileResults = findResourceProfileResults(resourceProfile, this.profilingResults);
        if (!profileResults || !profileResults.results) {
            throw new Error(`No Profiling results for ${getResourceProfileId(resourceProfile)}`);
        }

        const result = findResultForInput(input.totalDataSizeBytes, profileResults.results);
        output.executionTimeMs = result.executionTimeMs;
        if (!result.executionCost) {
            throw new Error('Execution cost is missing from ProfileResults');
        }
        output.cost = +result.executionCost;
        return output;
    }

}
