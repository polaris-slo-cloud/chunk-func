import { WorkflowExecutionDescription, WorkflowStepType } from '../../model';
import { InputOutputData } from '../data';
import { StepState, WorkflowState } from '../state';
import { AccumulatedStepInput, StepInput, StepOutput, WorkflowFunctionStep, WorkflowStep, WorkflowStepExecutionLog } from '../step';
import { WorkflowThread } from '../thread';
import { ResourceConfigurationStrategy, Workflow, WorkflowInput, WorkflowOutput } from '../workflow';
import { WorkflowStateImpl } from './state.impl';
import { WorkflowThreadImpl } from './thread.impl';

/**
 * Represents a single execution of a workflow.
 */
export class WorkflowExecution {

    workflow: Workflow;

    private executionDescription?: WorkflowExecutionDescription;
    private state: WorkflowState = {} as WorkflowState;
    private resourceConfigStrat: ResourceConfigurationStrategy;

    constructor(workflow: Workflow, resourceConfigStrat: ResourceConfigurationStrategy) {
        this.workflow = workflow;
        this.resourceConfigStrat = resourceConfigStrat;
    }

    /**
     * Executes the workflow using the specified input.
     *
     * @param input The input for the workflow execution.
     * `input.data` is used as the input to the first step.
     */
    run<I, O>(input: WorkflowInput<I>): WorkflowOutput<O> {
        this.executionDescription = input.executionDescription;
        this.state = new WorkflowStateImpl({
            executionDescription: input.executionDescription,
        });

        const mainThread = WorkflowThreadImpl.createWorkflowThread();
        this.addThread(mainThread);
        this.triggerStep(this.workflow.graph.start, { data: input.data, thread: mainThread });

        let stepOutput: StepOutput | undefined;
        let currStep: WorkflowStep | undefined;

        while ((currStep = this.state.queuedSteps.dequeue())) {
            stepOutput = this.executeStep(currStep);
        }

        if (!stepOutput) {
            throw new Error('Workflow did not produce any output.');
        }

        const stepStats = this.collectStepLogs();
        const finalExecMetrics = this.state.getExecutionMetrics(mainThread);
        const workflowOutput: WorkflowOutput<O> = {
            executionTimeMs: finalExecMetrics.executionTimeMs,
            executionCost: finalExecMetrics.executionCost,
            data: stepOutput.data,
            stepLogs: stepStats.stepLogs,
            avgResourceConfigStrategyExecutionTimeMs: stepStats.avgResConfigStratExecTimeMs,
            sloFulfilled: this.state.slo.isFulfilled(finalExecMetrics),
        }
        return workflowOutput;
    }

    /**
     * Adds the input to the step's received inputs and adds the step to the queue,
     * if all required inputs have been received.
     */
    protected triggerStep(step: WorkflowStep, input: StepInput): void {
        let stepState = this.state.steps[step.name];
        if (stepState) {
            stepState.receivedInputs.push(input)
        } else {
            stepState = {
                receivedInputs: [ input ],
                executionTimeMs: 0,
                executionCost: 0,
                resourceConfigStrategyExecutionTimeMs: -1,
            };
            this.state.steps[step.name] = stepState;
        }

        if (this.canStepExecute(step, stepState)) {
            this.state.queuedSteps.enqueue(step);
        }
    }

    protected triggerNextSteps(srcStep: WorkflowStep, srcThread: WorkflowThread, nextSteps: string[], inputData: InputOutputData): void {
        for (let i = 0; i < nextSteps.length; ++i) {
            const nextStep = this.workflow.graph.steps[nextSteps[i]];
            const nextStepThread = i === 0 ? srcThread : srcThread.fork();
            const nextStepInput: StepInput = { srcStep: srcStep.name, thread: nextStepThread, data: inputData };
            this.triggerStep(nextStep, nextStepInput);
        }
    }

    protected canStepExecute(step: WorkflowStep, stepState: StepState): boolean {
        return !step.requiredInputs || step.requiredInputs.length === stepState.receivedInputs.length;
    }

    /**
     * Executes the step, advances time in its thread, and updates the totalCost of the workflow.
     */
    protected executeStep(step: WorkflowStep): StepOutput {
        const stepState = this.state.steps[step.name];
        const accumulatedInput = this.joinThreadsAndAccumulateInput(stepState.receivedInputs);
        const thread = accumulatedInput.thread;
        stepState.selectedConfig = undefined;

        if (step.type === WorkflowStepType.Function) {
            const start = Date.now();
            stepState.selectedConfig = this.resourceConfigStrat.chooseConfiguration(this.state, step as WorkflowFunctionStep, accumulatedInput);
            stepState.resourceConfigStrategyExecutionTimeMs = Date.now() - start;
        }

        const stepOutput = step.execute(accumulatedInput, stepState.selectedConfig, this.executionDescription!);
        stepState.executionTimeMs = stepOutput.executionTimeMs;
        stepState.executionCost = stepOutput.cost;
        thread.advance(stepOutput.executionTimeMs);
        this.state.totalCost += stepOutput.cost;

        if (stepOutput.nextSteps) {
            this.triggerNextSteps(step, thread, stepOutput.nextSteps, stepOutput.data);
        }

        return stepOutput;
    }

    protected addThread(thread: WorkflowThread): void {
        this.state.activeThreads[thread.id] = thread;
    }

    protected removeThread(thread: WorkflowThread): void {
        delete this.state.activeThreads[thread.id];
    }

    /** Forks the thread and adds it to the state. */
    protected forkThread(thread: WorkflowThread): WorkflowThread {
        const newThread = thread.fork();
        this.addThread(newThread);
        return newThread;
    }

    /**
     * Joins the thread with the higher ID into the thread with the lower ID, stopping
     * the one with the higher ID and removing it from the state.
     *
     * ```
     * lowerIdThread.join(higherIdThread)
     * ```
     */
    protected joinThreads(threadA: WorkflowThread, threadB: WorkflowThread): WorkflowThread {
        let lowerIdThread: WorkflowThread;
        let higherIdThread: WorkflowThread;
        if (threadA.id < threadB.id) {
            lowerIdThread = threadA;
            higherIdThread = threadB;
        } else {
            lowerIdThread = threadB;
            higherIdThread = threadA;
        }

        lowerIdThread.join(higherIdThread);
        this.removeThread(higherIdThread);
        return lowerIdThread;
    }

    protected joinThreadsAndAccumulateInput(receivedInputs: StepInput[]): AccumulatedStepInput {
        const accumulated: AccumulatedStepInput = {
            individualInputs: receivedInputs,
            totalDataSizeBytes: 0,
            thread: receivedInputs[0].thread,
        };

        for (const input of receivedInputs) {
            accumulated.totalDataSizeBytes += input.data.sizeBytes;
            if (accumulated.thread !== input.thread) {
                accumulated.thread = this.joinThreads(accumulated.thread, input.thread);
            }
        }

        return accumulated;
    }

    protected collectStepLogs(): { stepLogs: Record<string, WorkflowStepExecutionLog>, avgResConfigStratExecTimeMs: number } {
        let totalResConfigExecTimeMs = 0;
        let totalFunctionSteps = 0;
        const keys = Object.keys(this.state.steps);
        const stepLogs: Record<string, WorkflowStepExecutionLog> = {};

        keys.forEach(stepName => {
            const step = this.workflow.graph.steps[stepName];
            if (step.type === WorkflowStepType.Function) {
                const stepState = this.state.steps[stepName];
                stepLogs[stepName] = {
                    resourceProfile: stepState.selectedConfig!,
                    executionTimeMs: stepState.executionTimeMs,
                    executionCost: stepState.executionCost,
                    resourceConfigStrategyExecutionTimeMs: stepState.resourceConfigStrategyExecutionTimeMs,
                };

                if (stepState.resourceConfigStrategyExecutionTimeMs !== -1) {
                    totalResConfigExecTimeMs += stepState.resourceConfigStrategyExecutionTimeMs;
                    ++ totalFunctionSteps;
                }
            }
        });

        return {
            stepLogs,
            avgResConfigStratExecTimeMs: totalFunctionSteps > 0 ? totalResConfigExecTimeMs / totalFunctionSteps : 0,
        };
    }

}
