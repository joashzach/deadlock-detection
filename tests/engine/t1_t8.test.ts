import { describe, it, expect } from 'vitest';
import {
  detectCycleSingleInstance,
  detectMatrixMultiInstance,
  detectDeadlock,
  checkBankersSafety,
  evaluateBankersRequest,
  checkPreventionPolicy,
  SimulatorEngine,
  ProcessScript,
} from '../../src/engine';
import {
  presetClassicDeadlock,
  presetSafeChain,
  presetBankersSafe,
  presetMultiInstanceSafe,
  presetMultiInstanceDeadlock,
  presetDiningPhilosophers,
} from '../../src/scenarios/presets';

describe('Authoritative Reference Tests T1 - T8', () => {
  // T1 — Classic deadlock (single-instance)
  // P1 holds R1, requests R2; P2 holds R2, requests R1 -> deadlocked {P1, P2}
  it('T1: Classic deadlock (single-instance)', () => {
    const res = detectCycleSingleInstance(presetClassicDeadlock);
    expect(res.result.hasDeadlock).toBe(true);
    expect(res.result.deadlockedProcessIds).toEqual(['P1', 'P2']);
    expect(res.result.cycleMemberIds).toEqual(['P1', 'P2']);
    expect(res.steps.length).toBeGreaterThan(0);
    expect(res.steps[res.steps.length - 1]!.title).toContain('Conclusion');
  });

  // T2 — No deadlock (chain)
  // P1 holds R1, requests R2; P2 holds R2, requests nothing -> no deadlock
  it('T2: No deadlock (chain)', () => {
    const res = detectCycleSingleInstance(presetSafeChain);
    expect(res.result.hasDeadlock).toBe(false);
    expect(res.result.deadlockedProcessIds).toEqual([]);
    expect(res.result.cycleMemberIds).toEqual([]);
    expect(res.steps.length).toBeGreaterThan(0);
  });

  // T3 — Banker's safe state (Available = [3, 3, 2]; totals A=10, B=5, C=7)
  // Safe; <P1, P3, P4, P0, P2> is valid
  // Request P1 = [1, 0, 2] -> Granted
  // Then P4 = [3, 3, 0] -> Must wait (not available)
  // Then P0 = [0, 2, 0] -> Denied (unsafe)
  // Any request exceeding Need -> Error
  describe("T3: Banker's algorithm safe state and requests", () => {
    it('T3.1: Initial state is safe and produces a valid safe sequence', () => {
      const safety = checkBankersSafety(presetBankersSafe);
      expect(safety.result.isSafe).toBe(true);
      expect(safety.result.safeSequence).toBeDefined();

      // Validate returned safe sequence
      const seq = safety.result.safeSequence!;
      expect(seq.length).toBe(5);

      // Verify that this sequence can actually execute sequentially
      let work = [...presetBankersSafe.available!];
      const pMap = new Map(presetBankersSafe.processes.map((p, idx) => [p.id, idx]));

      for (const pid of seq) {
        const pIdx = pMap.get(pid)!;
        const need = presetBankersSafe.need![pIdx]!;
        const alloc = presetBankersSafe.allocation![pIdx]!;

        // Check need <= work
        for (let j = 0; j < work.length; j++) {
          expect(need[j]!).toBeLessThanOrEqual(work[j]!);
        }
        // Work += alloc
        for (let j = 0; j < work.length; j++) {
          work[j]! += alloc[j]!;
        }
      }
    });

    it('T3.2: Request P1 = [1, 0, 2] is GRANTED', () => {
      const reqP1 = evaluateBankersRequest(presetBankersSafe, 'P1', [1, 0, 2]);
      expect(reqP1.result.outcome).toBe('GRANTED');
      expect(reqP1.result.updatedState).toBeDefined();

      // State after granting P1:
      const stateAfterP1 = reqP1.result.updatedState!;

      // Then P4 requests [3, 3, 0] -> Must wait (not available)
      const reqP4 = evaluateBankersRequest(stateAfterP1, 'P4', [3, 3, 0]);
      expect(reqP4.result.outcome).toBe('WAIT_UNAVAILABLE');

      // Then P0 requests [0, 2, 0] -> Denied (unsafe)
      const reqP0 = evaluateBankersRequest(stateAfterP1, 'P0', [0, 2, 0]);
      expect(reqP0.result.outcome).toBe('DENIED_UNSAFE');

      // Any request exceeding Need -> Error
      // Need for P0 in stateAfterP1 is [7, 4, 3] -> request [8, 0, 0]
      const reqErr = evaluateBankersRequest(stateAfterP1, 'P0', [8, 0, 0]);
      expect(reqErr.result.outcome).toBe('ERROR_EXCEEDS_NEED');
    });
  });

  // T4 — Multi-instance detection, no deadlock (Available = [0, 0, 0])
  it('T4: Multi-instance detection, no deadlock', () => {
    const res = detectMatrixMultiInstance(presetMultiInstanceSafe);
    expect(res.result.hasDeadlock).toBe(false);
    expect(res.result.deadlockedProcessIds).toEqual([]);
    expect(res.steps.length).toBeGreaterThan(0);
  });

  // T5 — T4 with P2 Request = [0, 0, 1] -> deadlocked {P1, P2, P3, P4}
  it('T5: Multi-instance deadlock with P2 request', () => {
    const res = detectMatrixMultiInstance(presetMultiInstanceDeadlock);
    expect(res.result.hasDeadlock).toBe(true);
    expect(res.result.deadlockedProcessIds.sort()).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(res.result.deadlockedProcessIds).not.toContain('P0');
  });

  // T6 — Circular-wait prevention: with ordering R1 < R2 < R3,
  // a process holding R2 requesting R1 is rejected; requesting R3 is allowed
  it('T6: Circular-wait prevention with ordered resources', () => {
    const system = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
        { id: 'R3', name: 'R3', totalInstances: 1 },
      ],
      edges: [{ id: 'e1', type: 'assignment' as const, from: 'R2', to: 'P0', count: 1 }],
    };

    const policy = {
      breakCircularWait: true,
      breakHoldAndWait: false,
      breakNoPreemption: false,
    };

    // Requesting R1 (index 0 < index 1) is rejected
    const checkR1 = checkPreventionPolicy(system, 'P0', 'R1', 1, policy);
    expect(checkR1.allowed).toBe(false);
    expect(checkR1.coffmanCondition).toBe('Circular Wait');

    // Requesting R3 (index 2 > index 1) is allowed
    const checkR3 = checkPreventionPolicy(system, 'P0', 'R3', 1, policy);
    expect(checkR3.allowed).toBe(true);
  });

  // T7 — Hold-and-wait prevention: a process needing {R1, R2} when only R1 is free
  // receives nothing (no partial grant)
  it('T7: Hold-and-wait prevention rejects partial allocation if already holding', () => {
    const systemHolding = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
      ],
      edges: [{ id: 'e1', type: 'assignment' as const, from: 'R1', to: 'P0', count: 1 }],
    };

    const policy = {
      breakCircularWait: false,
      breakHoldAndWait: true,
      breakNoPreemption: false,
    };

    const check = checkPreventionPolicy(systemHolding, 'P0', 'R2', 1, policy);
    expect(check.allowed).toBe(false);
    expect(check.coffmanCondition).toBe('Hold and Wait');
  });

  // T8 — Dining philosophers (5):
  // all pick the left fork first -> deadlock detected;
  // with ordering policy enabled -> run completes, no deadlock.
  it('T8: Dining philosophers deadlock and circular-wait prevention', () => {
    // 1. Initial configuration is deadlocked
    const detection = detectDeadlock(presetDiningPhilosophers);
    expect(detection.result.hasDeadlock).toBe(true);
    expect(detection.result.deadlockedProcessIds.sort()).toEqual(['P0', 'P1', 'P2', 'P3', 'P4']);

    // 2. Simulator: each philosopher script picks left fork then right fork then releases both
    const scripts: ProcessScript[] = [
      {
        processId: 'P0',
        instructions: [
          { type: 'request', resourceId: 'R0', count: 1 },
          { type: 'request', resourceId: 'R1', count: 1 },
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R0', count: 1 },
          { type: 'release', resourceId: 'R1', count: 1 },
        ],
      },
      {
        processId: 'P1',
        instructions: [
          { type: 'request', resourceId: 'R1', count: 1 },
          { type: 'request', resourceId: 'R2', count: 1 },
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R1', count: 1 },
          { type: 'release', resourceId: 'R2', count: 1 },
        ],
      },
      {
        processId: 'P2',
        instructions: [
          { type: 'request', resourceId: 'R2', count: 1 },
          { type: 'request', resourceId: 'R3', count: 1 },
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R2', count: 1 },
          { type: 'release', resourceId: 'R3', count: 1 },
        ],
      },
      {
        processId: 'P3',
        instructions: [
          { type: 'request', resourceId: 'R3', count: 1 },
          { type: 'request', resourceId: 'R4', count: 1 },
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R3', count: 1 },
          { type: 'release', resourceId: 'R4', count: 1 },
        ],
      },
      {
        processId: 'P4',
        instructions: [
          { type: 'request', resourceId: 'R4', count: 1 },
          { type: 'request', resourceId: 'R0', count: 1 }, // Request lower index R0 while holding R4
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R4', count: 1 },
          { type: 'release', resourceId: 'R0', count: 1 },
        ],
      },
    ];

    // Clean initial state (no edges held yet)
    const cleanDPState = {
      processes: [...presetDiningPhilosophers.processes],
      resources: [...presetDiningPhilosophers.resources],
      edges: [],
    };

    // Run with breakCircularWait enabled
    const simWithPolicy = new SimulatorEngine(
      cleanDPState,
      scripts,
      {
        breakCircularWait: true,
        breakHoldAndWait: false,
        breakNoPreemption: false,
      },
      50
    );

    let finalSnapshot = simWithPolicy.getSnapshot();
    for (let t = 0; t < 50 && !finalSnapshot.isFinished; t++) {
      finalSnapshot = simWithPolicy.step();
    }

    // Circular-wait policy rejected P4's backwards request, preventing mutual deadlock
    expect(finalSnapshot.events.some((e) => e.outcome === 'rejected_policy')).toBe(true);
    expect(finalSnapshot.events.some((e) => e.policyNotice?.coffmanCondition === 'Circular Wait')).toBe(true);
  });
});
