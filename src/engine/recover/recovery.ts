/**
 * Deadlock Recovery.
 * Strategies:
 * 1. Terminate all deadlocked processes.
 * 2. Terminate victim process (e.g., holding fewest resources, or specified).
 * 3. Preempt resources from a deadlocked process.
 * Always returns new state and automatically executes detection to verify resolution.
 */
import {
  SystemState,
  Step,
  TraceResult,
  RecoveryResult,
  RecoveryStrategy,
  EngineError,
} from '../types';
import { cloneSystemState, validateSystemState } from '../validate';
import { detectDeadlock } from '../detect';

export function executeRecovery(
  state: SystemState,
  strategy: RecoveryStrategy,
  options?: {
    victimProcessId?: string;
    preemptResourceId?: string;
    preemptCount?: number;
  }
): TraceResult<RecoveryResult> {
  validateSystemState(state);
  const steps: Step[] = [];
  const priorState = cloneSystemState(state);
  const priorDetection = detectDeadlock(priorState);
  const stepId = (idx: number) => `recovery-step-${idx}`;

  steps.push({
    id: stepId(steps.length),
    title: 'Initiate Deadlock Recovery',
    explanation: `Recovery initiated using strategy: ${strategy}. Prior state has deadlock: ${priorDetection.result.hasDeadlock}. Deadlocked processes: [${priorDetection.result.deadlockedProcessIds.join(', ')}].`,
    pseudocodeLine: 1,
    snapshot: priorState,
    highlight: {
      nodeIds: priorDetection.result.deadlockedProcessIds,
      type: 'warning',
    },
  });

  const nextState = cloneSystemState(state);
  let victimId = options?.victimProcessId;
  let preemptResId = options?.preemptResourceId;
  let preemptCount = options?.preemptCount ?? 1;

  if (strategy === 'TERMINATE_ALL') {
    const toTerminate = priorDetection.result.deadlockedProcessIds;
    if (toTerminate.length === 0) {
      throw new EngineError('NO_DEADLOCK_TO_RECOVER', 'No deadlocked processes to terminate');
    }

    // Remove all edges connected to these processes
    nextState.edges = nextState.edges.filter(
      (e) => !toTerminate.includes(e.from) && !toTerminate.includes(e.to)
    );
    // Remove processes
    nextState.processes = nextState.processes.filter((p) => !toTerminate.includes(p.id));

    steps.push({
      id: stepId(steps.length),
      title: 'Terminate All Deadlocked Processes',
      explanation: `Terminated processes [${toTerminate.join(', ')}]. All their allocated resources and pending requests have been reclaimed.`,
      pseudocodeLine: 2,
      snapshot: cloneSystemState(nextState),
      highlight: {
        nodeIds: toTerminate,
        type: 'danger',
      },
    });
  } else if (strategy === 'TERMINATE_VICTIM') {
    const deadlocked = priorDetection.result.deadlockedProcessIds;
    if (deadlocked.length === 0) {
      throw new EngineError('NO_DEADLOCK_TO_RECOVER', 'No deadlocked processes found for victim selection');
    }

    if (!victimId) {
      // Automatic selection heuristic: process in deadlocked set holding fewest total allocated instances
      let minAllocCount = Infinity;
      let chosen = deadlocked[0]!;

      for (const pid of deadlocked) {
        let totalHeld = 0;
        for (const e of state.edges) {
          if (e.type === 'assignment' && e.to === pid) {
            totalHeld += e.count;
          }
        }
        if (totalHeld < minAllocCount) {
          minAllocCount = totalHeld;
          chosen = pid;
        }
      }
      victimId = chosen;
    }

    // Terminate victim: remove edges and process
    nextState.edges = nextState.edges.filter(
      (e) => e.from !== victimId && e.to !== victimId
    );
    nextState.processes = nextState.processes.filter((p) => p.id !== victimId);

    steps.push({
      id: stepId(steps.length),
      title: `Terminate Victim Process ${victimId}`,
      explanation: `Process ${victimId} selected and terminated. All resources held by ${victimId} were released back into the pool.`,
      pseudocodeLine: 3,
      snapshot: cloneSystemState(nextState),
      highlight: {
        nodeIds: [victimId],
        type: 'danger',
      },
    });
  } else if (strategy === 'PREEMPT_RESOURCE') {
    const deadlocked = priorDetection.result.deadlockedProcessIds;
    if (deadlocked.length === 0) {
      throw new EngineError('NO_DEADLOCK_TO_RECOVER', 'No deadlocked processes found for resource preemption');
    }

    if (!victimId) {
      victimId = deadlocked[0]!;
    }

    // Find an assignment edge to preempt from victimId
    const assignmentEdges = nextState.edges.filter(
      (e) => e.type === 'assignment' && e.to === victimId
    );

    if (assignmentEdges.length === 0) {
      throw new EngineError(
        'CANNOT_PREEMPT',
        `Process ${victimId} holds no resources to preempt`
      );
    }

    const targetEdge = preemptResId
      ? assignmentEdges.find((e) => e.from === preemptResId)
      : assignmentEdges[0];

    if (!targetEdge) {
      throw new EngineError(
        'CANNOT_PREEMPT',
        `No assignment edge found matching resource ${preemptResId}`
      );
    }

    preemptResId = targetEdge.from;
    const actualPreemptCount = Math.min(preemptCount, targetEdge.count);

    if (targetEdge.count === actualPreemptCount) {
      nextState.edges = nextState.edges.filter((e) => e.id !== targetEdge.id);
    } else {
      targetEdge.count -= actualPreemptCount;
    }

    steps.push({
      id: stepId(steps.length),
      title: `Preempt ${actualPreemptCount} units of ${preemptResId} from ${victimId}`,
      explanation: `Preempted ${actualPreemptCount} instances of resource ${preemptResId} from process ${victimId}. Reclaimed instances returned to Available pool.`,
      pseudocodeLine: 4,
      snapshot: cloneSystemState(nextState),
      highlight: {
        nodeIds: [victimId, preemptResId],
        type: 'warning',
      },
    });
  }

  // Automatic verification: run detection on new state
  const postDetection = detectDeadlock(nextState);
  const resolved = !postDetection.result.hasDeadlock;

  steps.push({
    id: stepId(steps.length),
    title: resolved ? 'Deadlock Successfully Resolved' : 'Deadlock Persists After Recovery Step',
    explanation: resolved
      ? `Re-detection confirmed: No deadlock remains in the system. System state is clean.`
      : `Re-detection found remaining deadlocked processes: [${postDetection.result.deadlockedProcessIds.join(', ')}]. Additional recovery action required.`,
    pseudocodeLine: 5,
    snapshot: cloneSystemState(nextState),
    highlight: {
      nodeIds: postDetection.result.deadlockedProcessIds,
      type: resolved ? 'success' : 'danger',
    },
  });

  return {
    result: {
      actionTaken: {
        strategy,
        victimProcessId: victimId,
        preemptedResourceId: preemptResId,
        preemptedCount: preemptCount,
      },
      priorState,
      newState: nextState,
      resolved,
      postDetection: postDetection.result,
    },
    steps,
  };
}
