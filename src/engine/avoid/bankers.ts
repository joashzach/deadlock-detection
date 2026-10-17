/**
 * Banker's Algorithm (Avoidance).
 * 1. Safety Algorithm: determine if system is in a safe state and produce safe sequence.
 * 2. Resource-Request Algorithm: evaluate incoming request vector against Need & Available,
 *    provisionally allocate, check safety, and commit or rollback.
 */
import {
  SystemState,
  Step,
  TraceResult,
  BankersSafetyResult,
  BankersRequestResult,
  EngineError,
} from '../types';
import { cloneSystemState, validateSystemState } from '../validate';
import { deriveMatricesFromRAG, buildEdgesFromMatrices } from '../rag';

/**
 * Runs the Banker's Safety Algorithm with full trace.
 */
export function checkBankersSafety(state: SystemState): TraceResult<BankersSafetyResult> {
  validateSystemState(state);
  const steps: Step[] = [];
  const snapshot = cloneSystemState(state);

  const matrices = deriveMatricesFromRAG(state);
  const allocation = matrices.allocation;
  const need = matrices.need!;
  const available = [...matrices.available];

  const pCount = state.processes.length;
  const rCount = state.resources.length;
  const stepId = (idx: number) => `safety-step-${idx}`;

  // Work = Available; Finish[i] = false for all i
  const work = [...available];
  const finish: boolean[] = Array(pCount).fill(false);
  const safeSequence: string[] = [];
  const workTimeline: number[][] = [[...work]];

  steps.push({
    id: stepId(steps.length),
    title: 'Initialize Safety Vectors',
    explanation: `Safety check started. Work initialized to Available = [${work.join(', ')}]. Finish flags all set to false for processes [${state.processes.map((p) => p.id).join(', ')}].`,
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

  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < pCount; i++) {
      if (!finish[i]) {
        // Condition: Need[i] <= Work
        const canSatisfy = need[i]!.every((needVal, rIdx) => needVal <= work[rIdx]!);
        if (canSatisfy) {
          const pid = state.processes[i]!.id;
          const needStr = `[${need[i]!.join(', ')}]`;
          const prevWorkStr = `[${work.join(', ')}]`;

          // Work = Work + Allocation[i]
          for (let rIdx = 0; rIdx < rCount; rIdx++) {
            work[rIdx]! += allocation[i]![rIdx]!;
          }
          finish[i] = true;
          safeSequence.push(pid);
          workTimeline.push([...work]);
          found = true;

          steps.push({
            id: stepId(steps.length),
            title: `Process ${pid} is executable`,
            explanation: `Process ${pid} satisfies Need ${needStr} ≤ Work ${prevWorkStr}. System assumes ${pid} runs to completion and releases Allocation [${allocation[i]!.join(', ')}]. New Work = [${work.join(', ')}].`,
            pseudocodeLine: 2,
            snapshot,
            highlight: {
              nodeIds: [pid],
              matrixCells: state.resources.map((_, rIdx) => ({
                row: i,
                col: rIdx,
                matrix: 'need',
              })),
              type: 'active',
            },
            metadata: {
              work: [...work],
              finish: [...finish],
              chosenProcess: pid,
            },
          });
          break; // Restart scan from beginning to maintain standard deterministic order
        }
      }
    }
  }

  const isSafe = finish.every(Boolean);

  steps.push({
    id: stepId(steps.length),
    title: isSafe ? 'System is in a SAFE State' : 'System is in an UNSAFE State',
    explanation: isSafe
      ? `Safety algorithm completed successfully. Found safe sequence: <${safeSequence.join(', ')}>. All processes can finish without deadlock.`
      : `Safety algorithm concluded. System is UNSAFE. Unfinished processes: [${state.processes
          .filter((_, i) => !finish[i])
          .map((p) => p.id)
          .join(', ')}]. No complete safe sequence exists.`,
    pseudocodeLine: 4,
    snapshot,
    highlight: {
      nodeIds: isSafe ? safeSequence : state.processes.filter((_, i) => !finish[i]).map((p) => p.id),
      type: isSafe ? 'success' : 'danger',
    },
    metadata: {
      isSafe,
      safeSequence: isSafe ? safeSequence : undefined,
    },
  });

  return {
    result: {
      isSafe,
      safeSequence: isSafe ? safeSequence : undefined,
      workMatrixTimeline: workTimeline,
    },
    steps,
  };
}

/**
 * Runs Banker's Resource-Request Algorithm.
 * Evaluates whether a request from process `processId` can be safely granted.
 */
export function evaluateBankersRequest(
  state: SystemState,
  processId: string,
  requestVector: number[]
): TraceResult<BankersRequestResult> {
  validateSystemState(state);
  const steps: Step[] = [];
  const snapshot = cloneSystemState(state);
  const stepId = (idx: number) => `req-step-${idx}`;

  const pIdx = state.processes.findIndex((p) => p.id === processId);
  if (pIdx === -1) {
    throw new EngineError('PROCESS_NOT_FOUND', `Process ${processId} does not exist`);
  }

  if (requestVector.length !== state.resources.length) {
    throw new EngineError(
      'INVALID_REQUEST_VECTOR_LENGTH',
      `Request vector length (${requestVector.length}) must equal resources (${state.resources.length})`
    );
  }

  const matrices = deriveMatricesFromRAG(state);
  const need = matrices.need!;
  const available = matrices.available;
  const allocation = matrices.allocation;
  const max = matrices.max!;

  steps.push({
    id: stepId(steps.length),
    title: `Receive Request from ${processId}`,
    explanation: `Process ${processId} requests vector [${requestVector.join(', ')}]. Available = [${available.join(', ')}], Need[${processId}] = [${need[pIdx]!.join(', ')}].`,
    pseudocodeLine: 1,
    snapshot,
    highlight: {
      nodeIds: [processId],
      type: 'neutral',
    },
  });

  // Check 1: Request <= Need
  for (let j = 0; j < state.resources.length; j++) {
    if (requestVector[j]! > need[pIdx]![j]!) {
      const errReason = `Request vector [${requestVector.join(', ')}] exceeds declared Need [${need[pIdx]!.join(', ')}] at resource ${state.resources[j]!.id} (${requestVector[j]} > ${need[pIdx]![j]}).`;
      steps.push({
        id: stepId(steps.length),
        title: 'Request Exceeds Maximum Claim (Error)',
        explanation: errReason,
        pseudocodeLine: 2,
        snapshot,
        highlight: {
          nodeIds: [processId],
          type: 'danger',
        },
      });

      return {
        result: {
          outcome: 'ERROR_EXCEEDS_NEED',
          message: errReason,
        },
        steps,
      };
    }
  }

  // Check 2: Request <= Available
  for (let j = 0; j < state.resources.length; j++) {
    if (requestVector[j]! > available[j]!) {
      const waitReason = `Not enough available instances. Resource ${state.resources[j]!.id} has ${available[j]} available, but ${processId} requested ${requestVector[j]}. Process ${processId} must wait.`;
      steps.push({
        id: stepId(steps.length),
        title: 'Insufficient Resources Available (Must Wait)',
        explanation: waitReason,
        pseudocodeLine: 3,
        snapshot,
        highlight: {
          nodeIds: [processId, state.resources[j]!.id],
          type: 'warning',
        },
      });

      return {
        result: {
          outcome: 'WAIT_UNAVAILABLE',
          message: waitReason,
        },
        steps,
      };
    }
  }

  // Step 3: Pretend to allocate requested resources (Provisional state)
  const provisionalAlloc = allocation.map((row) => [...row]);
  const provisionalNeed = need.map((row) => [...row]);
  const provisionalAvail = [...available];

  for (let j = 0; j < state.resources.length; j++) {
    const delta = requestVector[j]!;
    provisionalAvail[j]! -= delta;
    provisionalAlloc[pIdx]![j]! += delta;
    provisionalNeed[pIdx]![j]! -= delta;
  }

  // Build provisional state with provisional edges
  const provisionalEdges = buildEdgesFromMatrices(
    state.processes,
    state.resources,
    provisionalAlloc,
    // Keep remaining requests if any, minus this fulfilled request
    matrices.request
  );

  const provisionalState: SystemState = {
    processes: [...state.processes],
    resources: [...state.resources],
    edges: provisionalEdges,
    allocation: provisionalAlloc,
    max,
    need: provisionalNeed,
    available: provisionalAvail,
  };

  steps.push({
    id: stepId(steps.length),
    title: 'Hypothetical Allocation Trial',
    explanation: `Provisionally allocated [${requestVector.join(', ')}] to ${processId}. Provisional Available = [${provisionalAvail.join(', ')}]. Now testing safety of the provisional state.`,
    pseudocodeLine: 4,
    snapshot: cloneSystemState(provisionalState),
    highlight: {
      nodeIds: [processId],
      type: 'active',
    },
  });

  // Run Safety Algorithm on provisional state
  const safetyResult = checkBankersSafety(provisionalState);
  // Append safety steps with unique IDs
  for (const sStep of safetyResult.steps) {
    steps.push({
      ...sStep,
      id: stepId(steps.length),
    });
  }

  if (safetyResult.result.isSafe) {
    const successMsg = `Request Granted. Provisional state is SAFE with sequence <${safetyResult.result.safeSequence!.join(', ')}>.`;
    steps.push({
      id: stepId(steps.length),
      title: 'Request GRANTED',
      explanation: successMsg,
      pseudocodeLine: 5,
      snapshot: cloneSystemState(provisionalState),
      highlight: {
        nodeIds: [processId],
        type: 'success',
      },
    });

    return {
      result: {
        outcome: 'GRANTED',
        message: successMsg,
        safetyResult: safetyResult.result,
        updatedState: provisionalState,
      },
      steps,
    };
  } else {
    const deniedMsg = `Request Denied (Unsafe). Granting this request would leave the system in an unsafe state where deadlocks cannot be prevented. Rolling back to original state.`;
    steps.push({
      id: stepId(steps.length),
      title: 'Request DENIED (Unsafe)',
      explanation: deniedMsg,
      pseudocodeLine: 6,
      snapshot,
      highlight: {
        nodeIds: [processId],
        type: 'danger',
      },
    });

    return {
      result: {
        outcome: 'DENIED_UNSAFE',
        message: deniedMsg,
        safetyResult: safetyResult.result,
        updatedState: snapshot,
      },
      steps,
    };
  }
}
