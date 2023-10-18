import { ResourceProfile } from '../model';
import { AccumulatedStepInput, ResourceConfigurationStrategy, WorkflowGraph, WorkflowState, WorkflowFunctionStep } from '../workflow';

/**
 * Base class for ResourceConfigurationStrategies
 */
export abstract class ResourceConfigurationStrategyBase implements ResourceConfigurationStrategy {

    readonly name: string;
    readonly workflowGraph: WorkflowGraph;
    readonly availableResourceProfiles: Record<string, ResourceProfile>;

    constructor(name: string, graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>) {
        this.name = name;
        this.workflowGraph = graph;
        this.availableResourceProfiles = availableResProfiles;
    }

    abstract chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile;

}
