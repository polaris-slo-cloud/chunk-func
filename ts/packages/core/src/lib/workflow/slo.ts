import { ExecutionMetrics } from '../model';
import { WorkflowThread } from './thread';
import { WeightMetrics } from './workflow-graph';

export const MAX_COST_SLO = 'MaxCost';
export const MAX_EXECUTION_TIME_SLO = 'MaxExecutionTime';

/**
 * Defines how the SLO limit should be interpreted.
 */
export enum SloLimitType {

    /**
     * The SLO limit describes the lower bound for the SLO weight,
     * i.e., the SLO weight must be greater than or equal to the limit.
     */
    LowerBound = 'LowerBound',

    /**
     * The SLO limit describes an average values for the SLO weight and
     * the weight must be within a range of the limit.
     */
    Average = 'Average',

    /**
     * The SLO limit describes the upper bound for the SLO weight,
     * i.e., the SLO weight must be less than or equal to the limit.
     */
    UpperBound = 'UpperBound',

}

/**
 * Defines what should be done with the optimization weight.
 */
export enum OptimizationWeightAction {

    /** The optimization weight should be minimized. */
    Minimize = 'Minimize',

    /** The optimization weight should be maximized. */
    Maximize = 'Maximize',

}

/**
 * Describes a workflow SLO.
 */
export interface ServiceLevelObjective {

    /** A string that identifies the type of SLO. */
    readonly sloType: string;

    /** Defines how the `sloLimit` should be interpreted. */
    readonly sloLimitType: SloLimitType;

    /** The limit value of the SLO. */
    readonly sloLimit: number;

    /** Defines what should be done with the optimization weight. */
    readonly optimizationWeightAction: OptimizationWeightAction;

    /**
     * @returns The SLO weight and the optimization weight extracted from the specified `ExecutionMetrics`.
     */
    getExecutionWeights(execMetrics: ExecutionMetrics): WeightMetrics;

    /**
     * @returns `true` if the specified metrics fulfill the SLO, otherwise `false`.
     */
    isFulfilled(execMetrics: ExecutionMetrics): boolean;

    /**]
     * @returns A clone of this SLO with the new SLO limit.
     */
    cloneWithNewLimit(newSloLimit: number): ServiceLevelObjective;

    // ToDo
    // Idea: Adding comparator methods for the SLO weight and the optimization weight could allow a fully
    // generic implementation that covers all possible OptimizationWeightActions.

}
