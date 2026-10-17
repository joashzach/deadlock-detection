/**
 * Single-Instance Deadlock Detection via Wait-For Graph (WFG) DFS Cycle Detection.
 * Generates full step-by-step trace.
 */
import { SystemState, Step, TraceResult, DetectionResult } from '../types';
import { cloneSystemState, validateSystemState } from '../validate';
import { convertRAGtoWFG } from '../rag';

export function detectCycleSingleInstance(state: SystemState): TraceResult<DetectionResult> {
  validateSystemState(state);
  const steps: Step[] = [];
  const snapshot = cloneSystemState(state);

  const wfg = convertRAGtoWFG(state);
  const stepId = (idx: number) => `cycle-step-${idx}`;

  steps.push({
    id: stepId(steps.length),
    title: 'Initialize Wait-For Graph (WFG)',
    explanation: `Constructed WFG from Resource Allocation Graph. Processes: [${wfg.processIds.join(', ')}]. Dependency edges: ${wfg.edges.length > 0 ? wfg.edges.map((e) => `${e.from} → ${e.to} (via ${e.viaResource})`).join(', ') : 'none'}.`,
    pseudocodeLine: 1,
    snapshot,
    highlight: {
      nodeIds: wfg.processIds,
      edgeIds: state.edges.map((e) => e.id),
      type: 'neutral',
    },
  });

  // Cycle detection state
  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting (recursion stack), 2: visited
  for (const pid of wfg.processIds) {
    visited.set(pid, 0);
  }

  const cycles: string[][] = [];
  const cycleMemberIdsSet = new Set<string>();
  const parentMap = new Map<string, string | null>();

  function dfs(u: string, path: string[]) {
    visited.set(u, 1);
    path.push(u);

    steps.push({
      id: stepId(steps.length),
      title: `Visit process ${u}`,
      explanation: `Exploring outgoing wait edges from ${u}. Current DFS path: ${path.join(' → ')}.`,
      pseudocodeLine: 2,
      snapshot,
      highlight: {
        nodeIds: [...path],
        type: 'active',
      },
    });

    const neighbors = wfg.adjacency.get(u) || [];
    for (const v of neighbors) {
      const vStatus = visited.get(v);
      if (vStatus === 1) {
        // Detected back-edge to a node in the current recursion stack => Cycle!
        const cycleStartIndex = path.indexOf(v);
        const cyclePath = path.slice(cycleStartIndex);
        cyclePath.push(v); // Close cycle for visual clarity
        cycles.push(cyclePath);

        for (const node of path.slice(cycleStartIndex)) {
          cycleMemberIdsSet.add(node);
        }

        steps.push({
          id: stepId(steps.length),
          title: `Deadlock Cycle Detected: ${cyclePath.join(' → ')}`,
          explanation: `Back-edge discovered from ${u} to ${v}. Cycle identified: ${cyclePath.join(' → ')}. Cycle members: [${path.slice(cycleStartIndex).join(', ')}].`,
          pseudocodeLine: 4,
          snapshot,
          highlight: {
            nodeIds: path.slice(cycleStartIndex),
            type: 'danger',
          },
        });
      } else if (vStatus === 0) {
        parentMap.set(v, u);
        dfs(v, path);
      }
    }

    path.pop();
    visited.set(u, 2);
  }

  for (const pid of wfg.processIds) {
    if (visited.get(pid) === 0) {
      dfs(pid, []);
    }
  }

  // Deadlocked set definition per PRD:
  // "Deadlocked set = all processes that can never finish under the current state.
  // This includes processes on a wait cycle and processes permanently blocked waiting on them."
  // Single-instance: anyone that can reach a cycle node in WFG is permanently blocked.
  const deadlockedSet = new Set<string>(cycleMemberIdsSet);

  if (cycleMemberIdsSet.size > 0) {
    // Reverse reachability: if P can reach any node in cycleMemberIdsSet, P is deadlocked
    let changed = true;
    while (changed) {
      changed = false;
      for (const [p, neighbors] of wfg.adjacency.entries()) {
        if (!deadlockedSet.has(p)) {
          // If any neighbor is deadlocked, p is waiting on a deadlocked process
          if (neighbors.some((nbr) => deadlockedSet.has(nbr))) {
            deadlockedSet.add(p);
            changed = true;
            steps.push({
              id: stepId(steps.length),
              title: `Cascade blocked process ${p}`,
              explanation: `Process ${p} is waiting on process(es) in the deadlocked set [${neighbors.filter((n) => deadlockedSet.has(n)).join(', ')}], so ${p} can never complete.`,
              pseudocodeLine: 5,
              snapshot,
              highlight: {
                nodeIds: [p, ...Array.from(cycleMemberIdsSet)],
                type: 'danger',
              },
            });
          }
        }
      }
    }
  }

  const deadlockedProcessIds = Array.from(deadlockedSet).sort();
  const cycleMemberIds = Array.from(cycleMemberIdsSet).sort();
  const hasDeadlock = deadlockedProcessIds.length > 0;

  // Coffman conditions assessment
  const hasHoldAndWait = state.edges.some((e1) =>
    e1.type === 'assignment' &&
    state.edges.some((e2) => e2.type === 'request' && e2.from === e1.to)
  );

  const hasAssignment = state.edges.some((e) => e.type === 'assignment');

  const coffmanStatus = {
    mutualExclusion: hasAssignment || state.resources.length > 0,
    holdAndWait: hasHoldAndWait,
    noPreemption: true, // Standard assumption unless preemption policy enabled
    circularWait: cycles.length > 0,
    reasons: {
      mutualExclusion: hasAssignment
        ? 'Resources are dedicated and non-shareable by concurrent processes.'
        : 'Resources are defined as mutually exclusive.',
      holdAndWait: hasHoldAndWait
        ? 'At least one process holds allocated resources while waiting for additional requested resources.'
        : 'No process is currently holding a resource while actively requesting another.',
      noPreemption: 'Resources cannot be forcibly confiscated from processes holding them.',
      circularWait: cycles.length > 0
        ? `Circular dependency chain detected: ${cycles.map((c) => c.join(' → ')).join('; ')}.`
        : 'No circular chain of processes waiting on held resources exists.',
    },
  };

  const finalResult: DetectionResult = {
    hasDeadlock,
    deadlockedProcessIds,
    cycleMemberIds,
    cycles,
    algorithmUsed: 'single-instance-wfg',
    coffmanStatus,
  };

  steps.push({
    id: stepId(steps.length),
    title: hasDeadlock ? 'Detection Conclusion: Deadlock Found' : 'Detection Conclusion: No Deadlock',
    explanation: hasDeadlock
      ? `Cycle detection concluded. Deadlock detected! Cycle members: [${cycleMemberIds.join(', ')}]. Full deadlocked set: [${deadlockedProcessIds.join(', ')}].`
      : 'Cycle detection concluded. WFG contains no directed cycles. The system is deadlock-free.',
    pseudocodeLine: 6,
    snapshot,
    highlight: {
      nodeIds: hasDeadlock ? deadlockedProcessIds : [],
      type: hasDeadlock ? 'danger' : 'success',
    },
  });

  return {
    result: finalResult,
    steps,
  };
}
