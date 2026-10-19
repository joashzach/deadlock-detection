import { SystemState, DetectionResult } from '../engine/types';

/**
 * Given a detection result with cycles, returns the set of RAG edge ids that
 * participate in a wait cycle. For a cycle P_a → P_b, the RAG edges are the
 * request edge P_a → R and the assignment edge R → P_b where P_b holds R.
 */
export function computeCycleEdgeIds(state: SystemState, detection: DetectionResult | null): Set<string> {
  const ids = new Set<string>();
  if (!detection || (!detection.cycles.length && !detection.deadlockedProcessIds.length)) return ids;

  const assignmentFor = (resourceId: string, processId: string) =>
    state.edges.find(
      (e) => e.type === 'assignment' && e.from === resourceId && e.to === processId
    );

  const rawCycles = detection.cycles.length > 0 ? detection.cycles : [detection.deadlockedProcessIds];

  for (const rawCycle of rawCycles) {
    if (rawCycle.length < 2) continue;
    const cycle = rawCycle[0] === rawCycle[rawCycle.length - 1] ? rawCycle : [...rawCycle, rawCycle[0]!];
    for (let i = 0; i < cycle.length - 1; i++) {
      const a = cycle[i]!;
      const b = cycle[i + 1]!;
      for (const req of state.edges) {
        if (req.type !== 'request' || req.from !== a) continue;
        const assign = assignmentFor(req.to, b);
        if (assign) {
          ids.add(req.id);
          ids.add(assign.id);
        }
      }
    }
  }
  return ids;
}

/**
 * Returns the total number of edges (request + assignment) participating in the deadlock cycle(s).
 */
export function computeCycleLength(state: SystemState, detection: DetectionResult | null): number {
  return computeCycleEdgeIds(state, detection).size;
}

/**
 * Returns the set of all node IDs (processes and resources) that participate in the deadlock cycle(s).
 */
export function computeCycleNodeIds(state: SystemState, detection: DetectionResult | null): Set<string> {
  const nodeIds = new Set<string>();
  const edgeIds = computeCycleEdgeIds(state, detection);
  for (const edge of state.edges) {
    if (edgeIds.has(edge.id)) {
      nodeIds.add(edge.from);
      nodeIds.add(edge.to);
    }
  }
  return nodeIds;
}
