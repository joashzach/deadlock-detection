/**
 * Multi-Instance Deadlock Detection Algorithm.
 * Implements the textbook matrix algorithm:
 *   Work = Available
 *   Finish[i] = true if Allocation[i] is all zeros, else false
 *   Find index i such that Finish[i] == false and Request[i] <= Work
 *   Work = Work + Allocation[i]; Finish[i] = true
 *   If any Finish[i] == false, deadlocked!
 */
import { SystemState, Step, TraceResult, DetectionResult } from '../types';
import { cloneSystemState, validateSystemState } from '../validate';
import { deriveMatricesFromRAG } from '../rag';

export function detectMatrixMultiInstance(state: SystemState): TraceResult<DetectionResult> {
  validateSystemState(state);
  const steps: Step[] = [];
  const snapshot = cloneSystemState(state);

  const matrices = deriveMatricesFromRAG(state);
  const allocation = matrices.allocation;
  const request = matrices.request;
  const available = [...matrices.available];

  const pCount = state.processes.length;
  const rCount = state.resources.length;
  const stepId = (idx: number) => `matrix-step-${idx}`;

  const work = [...available];
  const finish: boolean[] = Array(pCount).fill(false);

  // Step 1: Work = Available.
  // A process may only be pre-marked finished when it holds NOTHING and requests NOTHING,
  // because such a process neither holds nor waits for any resource. Processes that hold
  // nothing but are waiting for resources must still be simulated: they can be permanently
  // blocked by a deadlocked holder (PRD: "a process that is not waiting on anything is never
  // deadlocked", so a zero-allocation process that IS waiting may well be deadlocked).
  const initialDone: string[] = [];
  for (let i = 0; i < pCount; i++) {
    const isZeroAlloc = allocation[i]!.every((val) => val === 0);
    const isZeroReq = request[i]!.every((val) => val === 0);
    if (isZeroAlloc && isZeroReq) {
      finish[i] = true;
      initialDone.push(state.processes[i]!.id);
    }
  }

  steps.push({
    id: stepId(steps.length),
    title: 'Initialize Work and Finish vectors',
    explanation: `Work initialized to Available = [${work.join(', ')}]. Finish initialized: [${finish.map((f, i) => `${state.processes[i]!.id}: ${f}`).join(', ')}]. Processes that neither hold nor request resources [${initialDone.length > 0 ? initialDone.join(', ') : 'none'}] are marked finished. Every other process must be simulated because it either holds resources or is waiting for some.`,
    pseudocodeLine: 1,
    snapshot,
    highlight: {
      type: 'neutral',
    },
    metadata: {
      work: [...work],
      finish: [...finish],
    },
  });

  // Step 2 & 3: Find i such that Finish[i] == false and Request[i] <= Work
  let found = true;
  const executionOrder: string[] = [];

  while (found) {
    found = false;
    for (let i = 0; i < pCount; i++) {
      if (!finish[i]) {
        const canSatisfy = request[i]!.every((reqVal, rIdx) => reqVal <= work[rIdx]!);
        if (canSatisfy) {
          const pid = state.processes[i]!.id;
          const reqStr = `[${request[i]!.join(', ')}]`;
          const prevWorkStr = `[${work.join(', ')}]`;

          // Reclaim allocation
          for (let rIdx = 0; rIdx < rCount; rIdx++) {
            work[rIdx]! += allocation[i]![rIdx]!;
          }
          finish[i] = true;
          executionOrder.push(pid);
          found = true;

          steps.push({
            id: stepId(steps.length),
            title: `Process ${pid} can complete`,
            explanation: `Process ${pid} has Request ${reqStr} ≤ Work ${prevWorkStr}. It can receive its requested resources, finish execution, and release its allocation [${allocation[i]!.join(', ')}]. Updated Work = [${work.join(', ')}].`,
            pseudocodeLine: 3,
            snapshot,
            highlight: {
              nodeIds: [pid],
              matrixCells: state.resources.map((_, rIdx) => ({
                row: i,
                col: rIdx,
                matrix: 'allocation',
              })),
              type: 'active',
            },
            metadata: {
              work: [...work],
              finish: [...finish],
              executedProcess: pid,
            },
          });
          break; // restart scan
        }
      }
    }
  }

  // Step 4: Any Finish[i] == false are deadlocked
  const deadlockedProcessIds: string[] = [];
  for (let i = 0; i < pCount; i++) {
    if (!finish[i]) {
      deadlockedProcessIds.push(state.processes[i]!.id);
    }
  }

  const hasDeadlock = deadlockedProcessIds.length > 0;

  // Coffman conditions assessment
  const hasHoldAndWait = state.edges.some((e1) =>
    e1.type === 'assignment' &&
    state.edges.some((e2) => e2.type === 'request' && e2.from === e1.to)
  );

  const coffmanStatus = {
    mutualExclusion: state.resources.length > 0,
    holdAndWait: hasHoldAndWait,
    noPreemption: true,
    circularWait: hasDeadlock,
    reasons: {
      mutualExclusion: 'Multi-instance resource pool items are dedicated while assigned.',
      holdAndWait: hasHoldAndWait
        ? 'Processes hold currently allocated instances while waiting on ungranted requests.'
        : 'No process is simultaneously holding and requesting resources.',
      noPreemption: 'Resources are retained until voluntarily released by the process.',
      circularWait: hasDeadlock
        ? `Deadlocked processes [${deadlockedProcessIds.join(', ')}] are in a mutual wait cycle.`
        : 'No unresolvable circular wait condition exists across processes.',
    },
  };

  const finalResult: DetectionResult = {
    hasDeadlock,
    deadlockedProcessIds: [...deadlockedProcessIds].sort(),
    cycleMemberIds: [...deadlockedProcessIds].sort(),
    cycles: hasDeadlock ? [deadlockedProcessIds] : [],
    algorithmUsed: 'multi-instance-matrix',
    coffmanStatus,
  };

  steps.push({
    id: stepId(steps.length),
    title: hasDeadlock ? 'Detection Conclusion: Deadlock Detected' : 'Detection Conclusion: No Deadlock',
    explanation: hasDeadlock
      ? `Multi-instance algorithm concluded. Deadlocked set: [${deadlockedProcessIds.join(', ')}]. These processes cannot proceed because their requests exceed total available and reclaimable resources.`
      : `Multi-instance algorithm concluded. No deadlock detected. Feasible completion sequence: <${executionOrder.join(', ')}> leaving Work = [${work.join(', ')}].`,
    pseudocodeLine: 4,
    snapshot,
    highlight: {
      nodeIds: hasDeadlock ? deadlockedProcessIds : [],
      type: hasDeadlock ? 'danger' : 'success',
    },
    metadata: {
      work: [...work],
      finish: [...finish],
      deadlockedProcessIds,
    },
  });

  return {
    result: finalResult,
    steps,
  };
}
