import { ExecutionMetrics, WorkflowExecutionDescription } from '../../model';
import { MAX_COST_SLO, MAX_EXECUTION_TIME_SLO, OptimizationWeightAction, ServiceLevelObjective, SloLimitType } from '../slo';
import { WeightMetrics } from '../workflow-graph';

export function initSlo(executionDescription: WorkflowExecutionDescription): ServiceLevelObjective {
    // Ugly hack to maintain compatibility with existing scenario YAML files.
    if (!executionDescription.sloType && typeof executionDescription.maxResponseTimeMs === 'number') {
        executionDescription.sloType = MAX_EXECUTION_TIME_SLO;
        executionDescription.sloLimit = executionDescription.maxResponseTimeMs;
    }

    // The proper way to configure an SLO is through sloType and sloLimit.
    switch (executionDescription.sloType) {
        case MAX_EXECUTION_TIME_SLO:
            return new MaxExecutionTimeSlo(executionDescription.sloLimit);
        case MAX_COST_SLO:
            return new MaxCostSlo(executionDescription.sloLimit);
        default:
            throw new Error(`Unknown SLO type: ${executionDescription.sloType}`);
    }
}

export abstract class SloBase implements ServiceLevelObjective {

    readonly sloType: string;
    readonly sloLimitType: SloLimitType;
    readonly sloLimit: number;
    readonly optimizationWeightAction: OptimizationWeightAction;

    constructor(
        sloType: string,
        sloLimitType: SloLimitType,
        sloLimit: number,
        optWeightAction: OptimizationWeightAction,
    ) {
        this.sloType = sloType;
        this.sloLimitType = sloLimitType;
        this.sloLimit = sloLimit;
        this.optimizationWeightAction = optWeightAction;
    }

    abstract getExecutionWeights(expectedMetrics: ExecutionMetrics): WeightMetrics;

    abstract isFulfilled(execMetrics: ExecutionMetrics): boolean;

    abstract cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective;

}

export class MaxExecutionTimeSlo extends SloBase {

    constructor(sloLimit: number) {
        super(MAX_EXECUTION_TIME_SLO, SloLimitType.UpperBound, sloLimit, OptimizationWeightAction.Minimize);
    }

    override getExecutionWeights(expectedMetrics: ExecutionMetrics): WeightMetrics {
        return {
            sloWeight: expectedMetrics.executionTimeMs,
            optimizationWeight: expectedMetrics.executionCost,
        };
    }

    override isFulfilled(execMetrics: ExecutionMetrics): boolean {
        return execMetrics.executionTimeMs <= this.sloLimit;
    }

    cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective {
        return new MaxExecutionTimeSlo(newSloLimit);
    }

}

export class MaxCostSlo extends SloBase {

    constructor(sloLimit: number) {
        super(MAX_COST_SLO, SloLimitType.UpperBound, sloLimit, OptimizationWeightAction.Minimize);
    }

    override getExecutionWeights(expectedMetrics: ExecutionMetrics): WeightMetrics {
        return {
            sloWeight: expectedMetrics.executionCost,
            optimizationWeight: expectedMetrics.executionTimeMs,
        };
    }

    override isFulfilled(execMetrics: ExecutionMetrics): boolean {
        return execMetrics.executionCost <= this.sloLimit;
    }

    cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective {
        return new MaxCostSlo(newSloLimit);
    }

}
