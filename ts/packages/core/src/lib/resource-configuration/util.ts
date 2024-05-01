import { ProfilingResultWithProfileId } from '../model';
import { GetStepWeightFn, ServiceLevelObjective, WorkflowFunctionStep, WorkflowGraph } from '../workflow';

/**
 * @returns The ID of the best `ResourceProfile` that meets the `stepSlo` or `undefined` if no
 * `ResourceProfile` meets the `stepSlo`.
 */
export function findBestProfileForStepSlo(
    slo: ServiceLevelObjective,
    stepSlo: number,
    candidateProfilingResults: Iterable<ProfilingResultWithProfileId>,
): string | undefined {
    let selectedProfileOptWeight = Number.POSITIVE_INFINITY;
    let selectedProfileSloWeight = Number.POSITIVE_INFINITY;
    let selectedProfileId: string | undefined;

    for (const profilingResult of candidateProfilingResults) {
        const stepWeight = slo.getExecutionWeights(profilingResult.result);
        const stepSloWeight = stepWeight.sloWeight;
        if (stepSloWeight <= stepSlo) {
            const stepOptWeight = stepWeight.optimizationWeight;
            if (stepOptWeight < selectedProfileOptWeight || (stepOptWeight === selectedProfileOptWeight && stepSloWeight < selectedProfileSloWeight)) {
                selectedProfileOptWeight = stepOptWeight;
                selectedProfileSloWeight = stepSloWeight;
                selectedProfileId = profilingResult.resourceProfileId;
            }
        }
    }

    return selectedProfileId;
}

/**
 * Computes the SLO for the current step, given the critical path starting from it and based on the remaining SLO, not the original workflow SLO.
 */
export function computeStepSlo(
    workflowGraph: WorkflowGraph,
    currStep: WorkflowFunctionStep,
    remainingSlo: number,
    slo: ServiceLevelObjective,
    weightFn: GetStepWeightFn,
): number {
    const criticalPath = workflowGraph.findCriticalPath(currStep, workflowGraph.end, weightFn);
    const criticalPathWeight = slo.getExecutionWeights(criticalPath);
    const currStepWeight = weightFn(currStep);
    const criticalPathWeightWithSrc = criticalPathWeight.sloWeight + currStepWeight.sloWeight;

    const percentage = currStepWeight.sloWeight / criticalPathWeightWithSrc;
    if (percentage > 1) {
        throw new Error(`Current step percentage is ${percentage}`)
    }
    return remainingSlo * percentage;
}
