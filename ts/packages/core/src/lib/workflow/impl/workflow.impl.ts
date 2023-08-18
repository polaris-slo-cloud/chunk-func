import { WorkflowDescription } from '../../model';
import { ResourceConfigurationStrategy, Workflow, WorkflowInput, WorkflowOutput } from '../workflow';
import { WorkflowGraph } from '../workflow-graph';
import { WorkflowExecution } from './execution';

export type WorkflowConfig = Pick<Workflow, 'name' | 'graph' | 'maxExecutionTimeMs'>;

export class WorkflowImpl implements Workflow {

    readonly name: string;
    readonly graph: WorkflowGraph;
    maxExecutionTimeMs: number;

    constructor(description: WorkflowDescription, graph: WorkflowGraph) {
        this.name = description.name;
        this.graph = graph;
        this.maxExecutionTimeMs = description.maxResponseTimeMs;
    }

    execute<I, O>(input: WorkflowInput<I>, resourceConfigStrat: ResourceConfigurationStrategy): WorkflowOutput<O> {
        const execution = new WorkflowExecution(this, resourceConfigStrat);
        return execution.run(input);
    }

}
