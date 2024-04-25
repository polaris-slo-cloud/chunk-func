import { LinkedListQueue } from '../../collections';
import { WorkflowExecutionDescription } from '../../model';
import { MAX_COST_SLO, MAX_EXECUTION_TIME_SLO, ServiceLevelObjective } from '../slo';
import { StepState, WorkflowState } from '../state';
import { WorkflowStep } from '../step';
import { WorkflowThread } from '../thread';
import { MaxCostSlo, MaxExecutionTimeSlo } from './slo.impl';

export type WorkflowStateInitData = Pick<WorkflowState, 'executionDescription'>;

export class WorkflowStateImpl implements WorkflowState {

    activeThreads: Record<number, WorkflowThread> = {};
    queuedSteps = new LinkedListQueue<WorkflowStep>;
    steps: Record<string, StepState> = {};
    executionDescription: WorkflowExecutionDescription;

    slo: ServiceLevelObjective;
    totalCost = 0;

    constructor(initData: WorkflowStateInitData) {
        this.executionDescription = initData.executionDescription;
        this.slo = this.initSlo(initData.executionDescription);
    }

    private initSlo(executionDescription: WorkflowExecutionDescription): ServiceLevelObjective {
        // Ugly hack to maintain compatibility with existing scenario YAML files.
        if (!executionDescription.sloType && typeof executionDescription.maxResponseTimeMs === 'number') {
            executionDescription.sloType = MAX_EXECUTION_TIME_SLO;
            executionDescription.sloLimit = executionDescription.maxResponseTimeMs;
        }

        // The proper way to configure an SLO is through sloType and sloLimit.
        switch (executionDescription.sloType) {
            case MAX_EXECUTION_TIME_SLO:
                return new MaxExecutionTimeSlo(executionDescription.sloLimit, this);
            case MAX_COST_SLO:
                return new MaxCostSlo(executionDescription.sloLimit, this);
            default:
                throw new Error(`Unknown SLO type: ${executionDescription.sloType}`);
        }
    }

}
