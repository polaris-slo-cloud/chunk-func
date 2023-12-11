import { ResourceProfile, WorkflowDescription } from '../../model';
import { WorkflowStep } from '../step';
import { ResourceConfigurationStrategy, Workflow, WorkflowInput, WorkflowOutput } from '../workflow';
import { WorkflowGraph } from '../workflow-graph';
import { WorkflowExecution } from './execution';

export type WorkflowConfig = Pick<Workflow, 'name' | 'graph'>;

export class WorkflowImpl implements Workflow {

    readonly name: string;
    readonly graph: WorkflowGraph;
    readonly availableResourceProfiles: Record<string, ResourceProfile>

    constructor(description: WorkflowDescription, graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        this.name = description.name;
        this.graph = graph;
        this.availableResourceProfiles = availableResProfiles;
    }

    execute<I, O>(input: WorkflowInput<I>, resourceConfigStrat: ResourceConfigurationStrategy, startStep?: WorkflowStep): WorkflowOutput<O> {
        const execution = new WorkflowExecution(this, resourceConfigStrat);
        const output = execution.run<I, O>(input, startStep);
        return output;
    }

}
