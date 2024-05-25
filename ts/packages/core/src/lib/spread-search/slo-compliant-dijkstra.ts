import { Comparator, Heap } from 'heap-js';
import { FunctionNodeResourceConfigAttributes, GetStepWeightWithProfileFn, WorkflowResourceConfigDAG } from './model';

export type DAGPath = string[];
type NodeKey = string;
type NodePriorityQueue = Heap<string>;


interface GraphNodePathInfo {
    nodeKey: NodeKey;
    pathLengthFromSrc: number;
    pathSloFromSrc: number;
    predecessorKey?: NodeKey;
}

interface SloAwareShortestPathState {
    nodeInfos: Record<NodeKey, GraphNodePathInfo>;
    queue: NodePriorityQueue;
}

/**
 * Creates a Comparator for establishing a min-heap using AnnotatedGraphNode.pathLengthFromSrc.
 *
 * The Comparator function should returns the following values:
 * - positive number if `b` goes up in the heap
 * - 0 if `a == b`
 * - negative number if `a` goes up in the heap
 */
function createNodeMinComparator(nodeInfos: Record<string, GraphNodePathInfo>): Comparator<NodeKey> {
    return (a: NodeKey, b: NodeKey) => {
        const nodeA = nodeInfos[a];
        const nodeB = nodeInfos[b];
        return nodeA.pathLengthFromSrc - nodeB.pathLengthFromSrc;
    };
}

/**
 * Finds an SLO-compliant path between `srcNode` and `destNode` in the specified `graph`.
 *
 * This function uses a modified version of Dijkstra's shortest path algorithm that only updates a
 * node's distance if i) the alternative path still meets the SLO and ii) the alternative path's
 * SLO weight is less or equal to the current one.
 * The second condition may result in not picking the shortest path (this is why we call the function
 * find short path instead of shortest), but it increases the chances of meeting the SLO.
 *
 * - `WorkflowStepWeight.optimizationWeight` is used for determining the path length.
 * - `WorkflowStepWeight.sloWeight` is used for determining the SLO.
 *
 * @returns An SLO-compliant path or `undefined` if no such path exists.
 */
export function sloCompliantDijkstra(
    graph: WorkflowResourceConfigDAG,
    srcNode: string,
    destNode: string,
    slo: number,
    weightFn: GetStepWeightWithProfileFn,
): DAGPath | undefined {
    const state = initShortestPathState(graph, srcNode);

    let u: NodeKey | undefined;
    while ((u = state.queue.pop())) {
        if (u === destNode) {
            break;
        }

        const uInfo = state.nodeInfos[u];

        // If the known paths to u exceed the SLO, we skip u.
        if (uInfo.pathSloFromSrc > slo) {
            continue;
        }

        for (const v of graph.outNeighborEntries(u)) {
            const vInfo = state.nodeInfos[v.neighbor];

            let altPathLength: number;
            let altPathSlo: number;
            if (v.attributes.resourceProfile) {
                const stepWeight = weightFn(v.attributes as FunctionNodeResourceConfigAttributes);
                altPathLength = uInfo.pathLengthFromSrc + stepWeight.optimizationWeight;
                altPathSlo = uInfo.pathSloFromSrc + stepWeight.sloWeight;
            } else {
                altPathLength = uInfo.pathLengthFromSrc;
                altPathSlo = uInfo.pathSloFromSrc;
            }

            if (altPathLength < vInfo.pathLengthFromSrc) {
                // Update the distance to v only if the SLO is still met by the alt path and the alt path's SLO weight is at least as good as the previous one.
                if (altPathSlo <= slo && altPathSlo <= vInfo.pathSloFromSrc) {
                    state.queue.remove(vInfo.nodeKey);
                    vInfo.pathLengthFromSrc = altPathLength;
                    vInfo.pathSloFromSrc = altPathSlo;
                    vInfo.predecessorKey = u;
                    state.queue.add(vInfo.nodeKey);
                }
            }
        }
    }

    return convertToPath(state, srcNode, destNode);
}

function initShortestPathState(graph: WorkflowResourceConfigDAG, srcNode: NodeKey): SloAwareShortestPathState {
    const nodeInfos: Record<NodeKey, GraphNodePathInfo> = {};
    const state: SloAwareShortestPathState = {
        nodeInfos,
        queue: new Heap(createNodeMinComparator(nodeInfos)),
    };

    nodeInfos[srcNode] = {
        nodeKey: srcNode,
        pathLengthFromSrc: 0,
        pathSloFromSrc: 0,
    };
    state.queue.add(srcNode);

    const nodeKeys = graph.nodes();
    for (const nodeKey of nodeKeys) {
        if (nodeKey !== srcNode) {
            nodeInfos[nodeKey] = {
                nodeKey,
                pathLengthFromSrc: Number.POSITIVE_INFINITY,
                pathSloFromSrc: Number.POSITIVE_INFINITY,
            };
            state.queue.add(nodeKey);
        }
    }

    return state;
}

function convertToPath(state: SloAwareShortestPathState, srcNode: NodeKey, destNode: NodeKey): DAGPath | undefined {
    const destInfo = state.nodeInfos[destNode];
    if (!Number.isFinite(destInfo.pathLengthFromSrc)) {
        return undefined;
    }

    const path: DAGPath = [ ];
    let currNodeInfo: GraphNodePathInfo;
    for (currNodeInfo = destInfo; currNodeInfo.predecessorKey; currNodeInfo = state.nodeInfos[currNodeInfo.predecessorKey]) {
        path.push(currNodeInfo.nodeKey);
    }
    // When currNodeInfo points to srcNode, the loop stops, because it has no predecessor. Thus, we need to add it to the path now.
    path.push(currNodeInfo.nodeKey);
    return path.reverse();
}
