import { describe, it, expect } from 'vitest';
import {
  detectCycleSingleInstance,
  detectMatrixMultiInstance,
  detectDeadlock,
  checkBankersSafety,
  executeRecovery,
  EngineError,
  SystemState,
  validateSystemState,
} from '../../src/engine';

describe('Engine Edge Cases & Typed Errors', () => {
  it('handles empty system gracefully', () => {
    const emptyState: SystemState = {
      processes: [],
      resources: [],
      edges: [],
    };

    const cycleRes = detectCycleSingleInstance(emptyState);
    expect(cycleRes.result.hasDeadlock).toBe(false);
    expect(cycleRes.result.deadlockedProcessIds).toEqual([]);

    const matrixRes = detectMatrixMultiInstance(emptyState);
    expect(matrixRes.result.hasDeadlock).toBe(false);

    const safetyRes = checkBankersSafety(emptyState);
    expect(safetyRes.result.isSafe).toBe(true);
  });

  it('handles single process with no edges', () => {
    const state: SystemState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
      edges: [],
    };

    const res = detectDeadlock(state);
    expect(res.result.hasDeadlock).toBe(false);
    expect(res.result.deadlockedProcessIds).toEqual([]);
  });

  it('handles bystander process (not waiting) — never flagged as deadlocked', () => {
    // P1 and P2 deadlocked; P3 holds R3 and requests nothing (bystander)
    const state: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
        { id: 'P3', name: 'P3' }, // Bystander
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
        { id: 'R3', name: 'R3', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
        { id: 'e5', type: 'assignment', from: 'R3', to: 'P3', count: 1 }, // P3 holds R3, no requests
      ],
    };

    const res = detectDeadlock(state);
    expect(res.result.hasDeadlock).toBe(true);
    expect(res.result.deadlockedProcessIds).toContain('P1');
    expect(res.result.deadlockedProcessIds).toContain('P2');
    expect(res.result.deadlockedProcessIds).not.toContain('P3');
  });

  it('process blocked on a deadlocked process is in deadlocked set but NOT in cycle members', () => {
    // P1 <-> P2 cycle; P3 holds nothing and requests R1 (held by P1)
    const state: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
        { id: 'P3', name: 'P3' },
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
        { id: 'e5', type: 'request', from: 'P3', to: 'R1', count: 1 }, // P3 waits on P1
      ],
    };

    const res = detectCycleSingleInstance(state);
    expect(res.result.hasDeadlock).toBe(true);
    // Cycle members are strictly P1 and P2
    expect(res.result.cycleMemberIds.sort()).toEqual(['P1', 'P2']);
    // Deadlocked set includes permanently blocked P3
    expect(res.result.deadlockedProcessIds.sort()).toEqual(['P1', 'P2', 'P3']);
  });

  it('detects multiple disjoint cycles', () => {
    // Cycle 1: P1 <-> P2 via R1, R2
    // Cycle 2: P3 <-> P4 via R3, R4
    const state: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
        { id: 'P3', name: 'P3' },
        { id: 'P4', name: 'P4' },
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
        { id: 'R3', name: 'R3', totalInstances: 1 },
        { id: 'R4', name: 'R4', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },

        { id: 'e5', type: 'assignment', from: 'R3', to: 'P3', count: 1 },
        { id: 'e6', type: 'request', from: 'P3', to: 'R4', count: 1 },
        { id: 'e7', type: 'assignment', from: 'R4', to: 'P4', count: 1 },
        { id: 'e8', type: 'request', from: 'P4', to: 'R3', count: 1 },
      ],
    };

    const res = detectCycleSingleInstance(state);
    expect(res.result.hasDeadlock).toBe(true);
    expect(res.result.deadlockedProcessIds.sort()).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(res.result.cycles.length).toBeGreaterThanOrEqual(2);
  });

  it('recovery: terminates all deadlocked processes and resolves deadlock', () => {
    const state: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
      ],
    };

    const rec = executeRecovery(state, 'TERMINATE_ALL');
    expect(rec.result.resolved).toBe(true);
    expect(rec.result.postDetection.hasDeadlock).toBe(false);
    expect(rec.result.newState.processes.length).toBe(0);
  });

  it('recovery: terminates victim and resolves deadlock', () => {
    const state: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
      ],
    };

    const rec = executeRecovery(state, 'TERMINATE_VICTIM', { victimProcessId: 'P1' });
    expect(rec.result.resolved).toBe(true);
    expect(rec.result.postDetection.hasDeadlock).toBe(false);
    expect(rec.result.newState.processes.map((p) => p.id)).toEqual(['P2']);
  });

  it('recovery: preempts resource and resolves deadlock', () => {
    const state: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 1 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
      ],
    };

    const rec = executeRecovery(state, 'PREEMPT_RESOURCE', {
      victimProcessId: 'P1',
      preemptResourceId: 'R1',
      preemptCount: 1,
    });

    expect(rec.result.resolved).toBe(true);
    expect(rec.result.postDetection.hasDeadlock).toBe(false);
  });

  it('throws typed EngineError on invalid state or duplicate elements', () => {
    // Duplicate process ID
    expect(() =>
      validateSystemState({
        processes: [
          { id: 'P1', name: 'P1' },
          { id: 'P1', name: 'P1' },
        ],
        resources: [],
        edges: [],
      })
    ).toThrowError(EngineError);

    // Duplicate resource ID
    expect(() =>
      validateSystemState({
        processes: [],
        resources: [
          { id: 'R1', name: 'R1', totalInstances: 1 },
          { id: 'R1', name: 'R1', totalInstances: 1 },
        ],
        edges: [],
      })
    ).toThrowError(EngineError);

    // Exceeding allocation capacity
    expect(() =>
      validateSystemState({
        processes: [{ id: 'P1', name: 'P1' }],
        resources: [{ id: 'R1', name: 'R1', totalInstances: 1 }],
        edges: [{ id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 2 }],
      })
    ).toThrowError(EngineError);

    // Exceeding max limits (20)
    expect(() =>
      validateSystemState({
        processes: Array.from({ length: 21 }, (_, i) => ({ id: `P${i}`, name: `P${i}` })),
        resources: [],
        edges: [],
      })
    ).toThrowError(EngineError);
  });
});
