import { LinkedListQueue } from '../../collections';
import { ExecutionMetrics, WorkflowExecutionDescription } from '../../model';
import { ServiceLevelObjective } from '../slo';
import { StepState, WorkflowState } from '../state';
import { WorkflowStep } from '../step';
import { WorkflowThread } from '../thread';
import { initSlo } from './slo.impl';

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
        this.slo = initSlo(initData.executionDescription);
    }

    getExecutionMetrics(thread: WorkflowThread): ExecutionMetrics {
        return {
            executionTimeMs: thread.executionTimeMs,
            executionCost: this.totalCost,
        };
    }

}
