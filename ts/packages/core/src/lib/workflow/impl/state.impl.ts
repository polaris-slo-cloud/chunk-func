import { LinkedListQueue } from '../../collections';
import { StepState, WorkflowState } from '../state';
import { WorkflowStep } from '../step';
import { WorkflowThread } from '../thread';

export type WorkflowStateInitData = Pick<WorkflowState, 'maxExecutionTimeMs'>;

export class WorkflowStateImpl implements WorkflowState {

    activeThreads: Record<number, WorkflowThread> = {};
    queuedSteps = new LinkedListQueue<WorkflowStep>;
    steps: Record<string, StepState> = {};

    maxExecutionTimeMs: number;
    totalCost = 0;

    constructor(initData: WorkflowStateInitData) {
        this.maxExecutionTimeMs = initData.maxExecutionTimeMs;
    }

}
