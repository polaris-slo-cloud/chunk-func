import { WorkflowThread } from '../thread';

class IdCounter {
    private currId = -1;

    nextId(): number {
        return ++this.currId;
    }
}

export class WorkflowThreadImpl implements WorkflowThread {

    readonly id: number;

    private execTimeMs = 0;
    private active = true;

    get executionTimeMs(): number {
        return this.execTimeMs;
    }

    get isActive(): boolean {
        return this.active;
    }

    /**
     * Creates a new WorkflowThread to start a workflow.
     */
    static createWorkflowThread(): WorkflowThread {
        return new WorkflowThreadImpl(new IdCounter());
    }

    protected constructor(private idCounter: IdCounter) {
       this.id = this.idCounter.nextId();
    }

    advance(milliseconds: number): void {
        this.checkIfActiveOrThrow();
        this.execTimeMs += milliseconds;
    }

    fork(): WorkflowThread {
        this.checkIfActiveOrThrow();
        const forkedThread = new WorkflowThreadImpl(this.idCounter);
        forkedThread.execTimeMs = this.execTimeMs;
        return forkedThread;
    }

    join(other: WorkflowThread): void {
        this.checkIfActiveOrThrow();
        if (!other.isActive) {
            throw new Error('Cannot join a thread that is not active.')
        }
        this.execTimeMs = Math.max(this.execTimeMs, other.executionTimeMs);
        other.stop();
    }

    stop(): void {
        this.checkIfActiveOrThrow();
        this.active = false;
    }

    private checkIfActiveOrThrow(): void {
        if (!this.active) {
            throw new Error('This thread is not active anymore and must, thus, not be used other than for reading its execution time.')
        }
    }

}
