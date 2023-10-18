import { ResourceProfile, WorkflowDescription } from '../../model';
import { ResourceConfigurationStrategy, Workflow, WorkflowInput, WorkflowOutput } from '../workflow';
import { WorkflowGraph } from '../workflow-graph';
import { WorkflowExecution } from './execution';

export type WorkflowConfig = Pick<Workflow, 'name' | 'graph' | 'maxExecutionTimeMs'>;

export class WorkflowImpl implements Workflow {

    readonly name: string;
    readonly graph: WorkflowGraph;
    readonly availableResourceProfiles: Record<string, ResourceProfile>
    maxExecutionTimeMs: number;

    constructor(description: WorkflowDescription, graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        this.name = description.name;
        this.graph = graph;
        this.availableResourceProfiles = availableResProfiles;
        this.maxExecutionTimeMs = description.maxResponseTimeMs;
    }

    execute<I, O>(input: WorkflowInput<I>, resourceConfigStrat: ResourceConfigurationStrategy): WorkflowOutput<O> {
        const prevMaxExecTime = this.maxExecutionTimeMs;
        if (typeof input.executionDescription.maxResponseTimeMsOverride === 'number') {
            this.maxExecutionTimeMs = input.executionDescription.maxResponseTimeMsOverride;
        }

        const execution = new WorkflowExecution(this, resourceConfigStrat);
        const output = execution.run<I, O>(input);

        this.maxExecutionTimeMs = prevMaxExecTime;
        return output;
    }

}
