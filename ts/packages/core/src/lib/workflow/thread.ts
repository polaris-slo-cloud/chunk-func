
/**
 * Represents a thread of execution in a ChunkFunc workflow.
 *
 * WorkflowThreads are used for tracking time when simulating the execution of a workflow.
 * They are not related to OS threads that actually execute code.
 */
export interface WorkflowThread {

    /**
     * The ID of this thread.
     */
    readonly id: number;

    /**
     * Gets the time this thread has executed in milliseconds.
     */
    readonly executionTimeMs: number;

    /**
     * `true` if this thread is active and `false` if it has already stopped.
     *
     * Stopped threads must not be used, other than for reading their execution time, any more.
     */
    readonly isActive: boolean;

    /**
     * Advances this thread's execution time by `milliseconds`.
     */
    advance(milliseconds: number): void;

    /**
     * Creates a single fork of this thread with the same {@link executionTimeMs}.
     * Both, the parent and the fork, can be used for further execution.
     */
    fork(): WorkflowThread;

    /**
     * Joins this thread with the `other` thread.
     *
     * This sets this thread's {@link executionTimeMs} to the maximum of this thread's
     * value and that of `other`.
     *
     * The `other` thread must not be used anymore after it has been joined.
     */
    join(other: WorkflowThread): void;

    /**
     * Stops this thread.
     */
    stop(): void;

}
