import { ExecutionMetrics } from '../../model';
import { MAX_COST_SLO, MAX_EXECUTION_TIME_SLO, OptimizationWeightAction, ServiceLevelObjective, SloLimitType } from '../slo';
import { WorkflowState } from '../state';
import { WorkflowThread } from '../thread';
import { WeightMetrics } from '../workflow-graph';

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

    abstract getWorkflowWeights(activeThread: WorkflowThread): WeightMetrics;

    abstract getExecutionWeights(expectedMetrics: ExecutionMetrics): WeightMetrics;

    abstract cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective;

}

export class MaxExecutionTimeSlo extends SloBase {

    constructor(sloLimit: number, private workflowState: WorkflowState) {
        super(MAX_EXECUTION_TIME_SLO, SloLimitType.UpperBound, sloLimit, OptimizationWeightAction.Minimize);
    }

    override getWorkflowWeights(activeThread: WorkflowThread): WeightMetrics {
        return {
            sloWeight: activeThread.executionTimeMs,
            optimizationWeight: this.workflowState.totalCost,
        };
    }

    override getExecutionWeights(expectedMetrics: ExecutionMetrics): WeightMetrics {
        return {
            sloWeight: expectedMetrics.executionTimeMs,
            optimizationWeight: expectedMetrics.executionCost,
        };
    }

    cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective {
        return new MaxExecutionTimeSlo(newSloLimit, this.workflowState);
    }

}

export class MaxCostSlo extends SloBase {

    constructor(sloLimit: number, private workflowState: WorkflowState) {
        super(MAX_COST_SLO, SloLimitType.UpperBound, sloLimit, OptimizationWeightAction.Minimize);
    }

    override getWorkflowWeights(activeThread: WorkflowThread): WeightMetrics {
        return {
            sloWeight: this.workflowState.totalCost,
            optimizationWeight: activeThread.executionTimeMs,
        };
    }

    override getExecutionWeights(expectedMetrics: ExecutionMetrics): WeightMetrics {
        return {
            sloWeight: expectedMetrics.executionCost,
            optimizationWeight: expectedMetrics.executionTimeMs,
        };
    }

    cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective {
        return new MaxCostSlo(newSloLimit, this.workflowState);
    }

}
