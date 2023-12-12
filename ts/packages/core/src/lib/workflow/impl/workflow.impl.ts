import { cloneDeep } from 'lodash';
import { ResourceProfile } from '../../model';
import { WorkflowStep } from '../step';
import { ResourceConfigurationStrategy, Workflow, WorkflowInput, WorkflowOutput } from '../workflow';
import { WorkflowGraph } from '../workflow-graph';
import { WorkflowExecution } from './execution';

export type WorkflowConfig = Pick<Workflow, 'name' | 'graph'>;

export class WorkflowImpl implements Workflow {

    readonly name: string;
    readonly graph: WorkflowGraph;
    readonly availableResourceProfiles: Record<string, ResourceProfile>

    constructor(name: string, graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        this.name = name;
        this.graph = graph;
        this.availableResourceProfiles = availableResProfiles;
    }

    execute<I, O>(input: WorkflowInput<I>, resourceConfigStrat: ResourceConfigurationStrategy): WorkflowOutput<O> {
        const execution = new WorkflowExecution(this, resourceConfigStrat);
        const output = execution.run<I, O>(input);
        return output;
    }

    createSubWorkflow(startStep: WorkflowStep): Workflow {
        const subgraph = this.graph.createSubgraph(startStep);
        const profilesClone = cloneDeep(this.availableResourceProfiles);
        return new WorkflowImpl(`${this.name}-sub-${startStep.name}`, subgraph, profilesClone);
    }

}
