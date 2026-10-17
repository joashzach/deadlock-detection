import { SystemState, DetectionResult } from '../engine/types';

/**
 * Given a detection result with cycles, returns the set of RAG edge ids that
 * participate in a wait cycle. For a cycle P_a → P_b, the RAG edges are the
 * request edge P_a → R and the assignment edge R → P_b where P_b holds R.
 */
export function computeCycleEdgeIds(state: SystemState, detection: DetectionResult | null): Set<string> {
  const ids = new Set<string>();
  if (!detection || detection.cycles.length === 0) return ids;

  const assignmentFor = (resourceId: string, processId: string) =>
    state.edges.find(
      (e) => e.type === 'assignment' && e.from === resourceId && e.to === processId
    );

  for (const cycle of detection.cycles) {
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
