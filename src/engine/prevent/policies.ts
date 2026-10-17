/**
 * Deadlock Prevention Policies.
 * Addresses the 4 Coffman conditions:
 * 1. Mutual Exclusion: (Educational card / read-only rule)
 * 2. Hold & Wait: Atomic all-or-nothing allocation.
 * 3. No Preemption: Release held resources if cannot get all, or preempt from waiting holders.
 * 4. Circular Wait: Global total ordering of resources (e.g. R0 < R1 < R2).
 */
import { SystemState, PreventionPolicies, EngineError } from '../types';

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  policyViolated?: keyof PreventionPolicies;
  coffmanCondition?: 'Mutual Exclusion' | 'Hold and Wait' | 'No Preemption' | 'Circular Wait';
  remedyAction?: 'REJECT' | 'PREEMPT_HELD_RESOURCES' | 'ATOMIC_WAIT';
}

/**
 * Checks a requested resource allocation against active prevention policies.
 */
export function checkPreventionPolicy(
  state: SystemState,
  processId: string,
  targetResourceId: string,
  targetCount: number,
  policies: PreventionPolicies
): PolicyCheckResult {
  const pIndex = state.processes.findIndex((p) => p.id === processId);
  const rIndex = state.resources.findIndex((r) => r.id === targetResourceId);

  if (pIndex === -1 || rIndex === -1) {
    throw new EngineError('INVALID_POLICY_CHECK', `Unknown process or resource in policy check`);
  }

  // 1. Break Circular Wait: Global resource ordering by index (R0 < R1 < R2 ...)
  // Requesting a lower-indexed resource while holding a higher-indexed one is rejected.
  if (policies.breakCircularWait) {
    // Find highest index resource currently held by this process
    let highestHeldIndex = -1;
    let highestHeldId = '';

    for (let j = 0; j < state.resources.length; j++) {
      const res = state.resources[j]!;
      const isHolding = state.edges.some(
        (e) => e.type === 'assignment' && e.from === res.id && e.to === processId && e.count > 0
      );
      if (isHolding) {
        if (j > highestHeldIndex) {
          highestHeldIndex = j;
          highestHeldId = res.id;
        }
      }
    }

    if (highestHeldIndex !== -1 && rIndex <= highestHeldIndex) {
      return {
        allowed: false,
        reason: `Circular-wait prevention rejected request for ${targetResourceId} (index ${rIndex}). Process ${processId} currently holds ${highestHeldId} (index ${highestHeldIndex}). Policy requires strictly ascending resource requests.`,
        policyViolated: 'breakCircularWait',
        coffmanCondition: 'Circular Wait',
        remedyAction: 'REJECT',
      };
    }
  }

  // 2. Break Hold & Wait: All-or-nothing atomic acquisition.
  // If requesting a resource when another cannot be granted or holding others, cannot do partial allocations.
  if (policies.breakHoldAndWait) {
    const currentlyHoldingAny = state.edges.some(
      (e) => e.type === 'assignment' && e.to === processId && e.count > 0
    );

    if (currentlyHoldingAny) {
      return {
        allowed: false,
        reason: `Hold-and-wait prevention rejected request. Process ${processId} is already holding allocated resources. Under hold-and-wait prevention, a process must request all required resources at once before holding any.`,
        policyViolated: 'breakHoldAndWait',
        coffmanCondition: 'Hold and Wait',
        remedyAction: 'REJECT',
      };
    }
  }

  // 3. Break No Preemption
  if (policies.breakNoPreemption) {
    // If the resource is not immediately available, policy will preempt
    const targetResource = state.resources[rIndex]!;
    let currentAllocated = 0;
    for (const e of state.edges) {
      if (e.type === 'assignment' && e.from === targetResourceId) {
        currentAllocated += e.count;
      }
    }
    const freeInstances = targetResource.totalInstances - currentAllocated;
    if (freeInstances < targetCount) {
      return {
        allowed: false,
        reason: `No-preemption prevention: ${targetResourceId} has only ${freeInstances} free (< ${targetCount} requested). Process ${processId} must release all resources it currently holds.`,
        policyViolated: 'breakNoPreemption',
        coffmanCondition: 'No Preemption',
        remedyAction: 'PREEMPT_HELD_RESOURCES',
      };
    }
  }

  return {
    allowed: true,
    reason: 'Request conforms to all active prevention policies.',
  };
}
