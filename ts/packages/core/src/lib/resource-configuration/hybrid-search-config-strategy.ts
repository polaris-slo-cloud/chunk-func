import { ResourceProfile, getProfilingResultForProfile } from '../model';
import { AccumulatedStepInput, ChooseConfigurationStrategyFactory, Workflow, WorkflowFunctionStep, WorkflowGraph, WorkflowState } from '../workflow';
import { ProportionalCriticalPathSloConfigStrategy } from './proportional-critical-path-slo-config-strategy';
import { ResourceConfigurationStrategyBase } from './resource-configuration-strategy.base';
import { SpreadSearchConfigStrategy, SpreadSearchOptions } from './spread-search-config-strategy';

export const createHybridSearchConfigStrategy: ChooseConfigurationStrategyFactory =
    (workflow: Workflow, options?: Record<string, number>) => new HybridSearchConfigStrategy(workflow.graph, workflow.availableResourceProfiles, options || {});

/**
 * ResourceConfigurationStrategy that uses the SpreadSearch and ProportionalCriticalPath strategies and returns the cheaper result.
 */
export class HybridSearchConfigStrategy extends ResourceConfigurationStrategyBase {

    static readonly strategyName = 'HybridSearchConfigStrategy';

    private spreadSearch: SpreadSearchConfigStrategy;
    private proportionalCP: ProportionalCriticalPathSloConfigStrategy;

    constructor(graph: WorkflowGraph, availableResProfiles: Record<string, ResourceProfile>, options: Partial<SpreadSearchOptions>) {
        super(HybridSearchConfigStrategy.strategyName, graph, availableResProfiles);
        this.spreadSearch = new SpreadSearchConfigStrategy(graph, this.availableResourceProfiles, options);
        this.proportionalCP = new ProportionalCriticalPathSloConfigStrategy(graph, availableResProfiles);
    }

    chooseConfiguration(workflowState: WorkflowState, step: WorkflowFunctionStep, input: AccumulatedStepInput): ResourceProfile {
        const spreadSearchResProfile = this.spreadSearch.chooseConfiguration(workflowState, step, input);
        const propCpResProfile = this.proportionalCP.chooseConfiguration(workflowState, step, input);

        if (spreadSearchResProfile === propCpResProfile) {
            return spreadSearchResProfile;
        }

        const spreadSearchResult = getProfilingResultForProfile(step.profilingResults, input.totalDataSizeBytes, spreadSearchResProfile);
        const propCpResult = getProfilingResultForProfile(step.profilingResults, input.totalDataSizeBytes, propCpResProfile);

        // Return the profile that yields the cheaper result.
        if (spreadSearchResult.executionCost < propCpResult.executionCost) {
            return spreadSearchResProfile;
        }
        if (propCpResult.executionCost < spreadSearchResult.executionCost) {
            return propCpResProfile;
        }

        // If both profiles have the same cost, return the faster one.
        if (spreadSearchResult.executionTimeMs <= propCpResult.executionTimeMs) {
            return spreadSearchResProfile;
        }
        return propCpResProfile;
    }

}

