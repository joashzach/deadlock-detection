import { describe, it, expect } from 'vitest';
import {
  SystemState,
  EngineError,
  validateSystemState,
  buildEdgesFromMatrices,
  checkPreventionPolicy,
  executeRecovery,
  detectDeadlock,
  evaluateBankersRequest,
  SimulatorEngine,
  ProcessScript,
} from '../../src/engine';

describe('Validation branch coverage', () => {
  const base = {
    processes: [
      { id: 'P0', name: 'P0' },
      { id: 'P1', name: 'P1' },
    ],
    resources: [
      { id: 'R0', name: 'R0', totalInstances: 4 },
      { id: 'R1', name: 'R1', totalInstances: 4 },
    ],
  };

  it('rejects null/undefined state', () => {
    expect(() => validateSystemState(undefined as unknown as SystemState)).toThrowError(EngineError);
  });

  it('rejects non-array processes/resources/edges', () => {
    expect(() =>
      validateSystemState({ processes: null as unknown as [], resources: [], edges: [] })
    ).toThrowError(EngineError);
    expect(() =>
      validateSystemState({ processes: [], resources: null as unknown as [], edges: [] })
    ).toThrowError(EngineError);
    expect(() =>
      validateSystemState({ processes: [], resources: [], edges: null as unknown as [] })
    ).toThrowError(EngineError);
  });

  it('rejects invalid process and resource identifiers', () => {
    expect(() =>
      validateSystemState({ processes: [{ id: '', name: 'x' }], resources: [], edges: [] })
    ).toThrowError(EngineError);
    expect(() =>
      validateSystemState({
        processes: [],
        resources: [{ id: '', name: 'x', totalInstances: 1 }],
        edges: [],
      })
    ).toThrowError(EngineError);
  });

  it('rejects out-of-range instance counts', () => {
    for (const n of [0, 11, 1.5]) {
      expect(() =>
        validateSystemState({
          processes: [],
          resources: [{ id: 'R0', name: 'R0', totalInstances: n }],
          edges: [],
        })
      ).toThrowError(EngineError);
    }
  });

  it('rejects duplicate edges and invalid edge counts/ids/types', () => {
    expect(() =>
      validateSystemState({
        ...base,
        edges: [
          { id: 'e1', type: 'request', from: 'P0', to: 'R0', count: 1 },
          { id: 'e2', type: 'request', from: 'P0', to: 'R0', count: 1 },
        ],
      })
    ).toThrowError(EngineError);

    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: '', type: 'request', from: 'P0', to: 'R0', count: 1 }],
      })
    ).toThrowError(EngineError);

    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: 'e1', type: 'request', from: 'P0', to: 'R0', count: 0 }],
      })
    ).toThrowError(EngineError);

    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: 'e1', type: 'weird' as unknown as 'request', from: 'P0', to: 'R0', count: 1 }],
      })
    ).toThrowError(EngineError);
  });

  it('rejects request/assignment edges pointing at wrong node types', () => {
    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: 'e1', type: 'request', from: 'R0', to: 'R1', count: 1 }],
      })
    ).toThrowError(EngineError);
    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: 'e1', type: 'request', from: 'P0', to: 'P1', count: 1 }],
      })
    ).toThrowError(EngineError);
    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: 'e1', type: 'assignment', from: 'P0', to: 'P1', count: 1 }],
      })
    ).toThrowError(EngineError);
    expect(() =>
      validateSystemState({
        ...base,
        edges: [{ id: 'e1', type: 'assignment', from: 'R0', to: 'R0', count: 1 }],
      })
    ).toThrowError(EngineError);
  });

  it('rejects malformed matrices', () => {
    const withMatrices = (overrides: Partial<SystemState>) =>
      validateSystemState({ ...base, ...overrides } as SystemState);

    // allocation rows mismatch
    expect(() =>
      withMatrices({
        allocation: [[0, 0]],
        request: [[0, 0], [0, 0]],
        available: [4, 4],
      })
    ).toThrowError(EngineError);

    // allocation column mismatch
    expect(() =>
      withMatrices({
        allocation: [
          [0, 0, 0],
          [0, 0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        available: [4, 4],
      })
    ).toThrowError(EngineError);

    // negative value
    expect(() =>
      withMatrices({
        allocation: [
          [-1, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        available: [5, 4],
      })
    ).toThrowError(EngineError);

    // max rows mismatch
    expect(() =>
      withMatrices({
        allocation: [
          [0, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        max: [[1, 1]],
        available: [4, 4],
      })
    ).toThrowError(EngineError);

    // max column mismatch + negative + allocation exceeds max
    expect(() =>
      withMatrices({
        allocation: [
          [2, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        max: [
          [1, 1, 1],
          [1, 1],
        ],
        available: [2, 4],
      })
    ).toThrowError(EngineError);

    expect(() =>
      withMatrices({
        allocation: [
          [1, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        max: [
          [-1, 1],
          [1, 1],
        ],
        available: [3, 4],
      })
    ).toThrowError(EngineError);

    // need inconsistent
    expect(() =>
      withMatrices({
        allocation: [
          [1, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        max: [
          [2, 1],
          [1, 1],
        ],
        need: [
          [99, 1],
          [1, 1],
        ],
        available: [3, 4],
      })
    ).toThrowError(EngineError);

    // available length mismatch
    expect(() =>
      withMatrices({
        allocation: [
          [0, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        available: [4],
      })
    ).toThrowError(EngineError);

    // available inconsistent value
    expect(() =>
      withMatrices({
        allocation: [
          [0, 0],
          [0, 0],
        ],
        request: [
          [0, 0],
          [0, 0],
        ],
        available: [1, 4],
      })
    ).toThrowError(EngineError);
  });

  it('accepts a fully consistent matrix state', () => {
    expect(() =>
      validateSystemState({
        processes: [{ id: 'P0', name: 'P0' }],
        resources: [{ id: 'R0', name: 'R0', totalInstances: 3 }],
        edges: [],
        allocation: [[1]],
        request: [[0]],
        max: [[3]],
        need: [[2]],
        available: [2],
      })
    ).not.toThrow();
  });
});

describe('RAG matrix building coverage', () => {
  it('builds assignment and request edges from matrices', () => {
    const edges = buildEdgesFromMatrices(
      [
        { id: 'P0', name: 'P0' },
        { id: 'P1', name: 'P1' },
      ],
      [
        { id: 'R0', name: 'R0', totalInstances: 3 },
        { id: 'R1', name: 'R1', totalInstances: 3 },
      ],
      [
        [1, 0],
        [0, 2],
      ],
      [
        [0, 1],
        [1, 0],
      ]
    );

    expect(edges).toHaveLength(4);
    expect(edges.some((e) => e.type === 'assignment' && e.from === 'R0' && e.to === 'P0' && e.count === 1)).toBe(true);
    expect(edges.some((e) => e.type === 'assignment' && e.from === 'R1' && e.to === 'P1' && e.count === 2)).toBe(true);
    expect(edges.some((e) => e.type === 'request' && e.from === 'P0' && e.to === 'R1')).toBe(true);
    expect(edges.some((e) => e.type === 'request' && e.from === 'P1' && e.to === 'R0')).toBe(true);
  });
});

describe('Prevention policy branch coverage', () => {
  it('throws typed error for unknown process or resource', () => {
    const state: SystemState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
      edges: [],
    };
    const policies = { breakHoldAndWait: false, breakNoPreemption: false, breakCircularWait: false };
    expect(() => checkPreventionPolicy(state, 'PX', 'R0', 1, policies)).toThrowError(EngineError);
    expect(() => checkPreventionPolicy(state, 'P0', 'RX', 1, policies)).toThrowError(EngineError);
  });

  it('no-preemption policy demands release of held resources when target is unavailable', () => {
    const state: SystemState = {
      processes: [
        { id: 'P0', name: 'P0' },
        { id: 'P1', name: 'P1' },
      ],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
      edges: [{ id: 'e1', type: 'assignment', from: 'R0', to: 'P1', count: 1 }],
    };
    const res = checkPreventionPolicy(state, 'P0', 'R0', 1, {
      breakHoldAndWait: false,
      breakNoPreemption: true,
      breakCircularWait: false,
    });
    expect(res.allowed).toBe(false);
    expect(res.remedyAction).toBe('PREEMPT_HELD_RESOURCES');
    expect(res.coffmanCondition).toBe('No Preemption');
  });

  it('all policies disabled allows any valid request', () => {
    const state: SystemState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 2 }],
      edges: [],
    };
    const res = checkPreventionPolicy(state, 'P0', 'R0', 1, {
      breakHoldAndWait: false,
      breakNoPreemption: false,
      breakCircularWait: false,
    });
    expect(res.allowed).toBe(true);
  });
});

describe('Recovery branch coverage', () => {
  const deadlocked: SystemState = {
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

  it('auto-selects a victim holding the fewest resources when none specified', () => {
    const rec = executeRecovery(deadlocked, 'TERMINATE_VICTIM');
    expect(rec.result.resolved).toBe(true);
    expect(['P1', 'P2']).toContain(rec.result.actionTaken.victimProcessId);
  });

  it('throws when recovering a system with no deadlock', () => {
    const safe: SystemState = {
      processes: [{ id: 'P1', name: 'P1' }],
      resources: [{ id: 'R1', name: 'R1', totalInstances: 1 }],
      edges: [],
    };
    expect(() => executeRecovery(safe, 'TERMINATE_ALL')).toThrowError(EngineError);
    expect(() => executeRecovery(safe, 'TERMINATE_VICTIM')).toThrowError(EngineError);
    expect(() => executeRecovery(safe, 'PREEMPT_RESOURCE')).toThrowError(EngineError);
  });

  it('preempts a partial count from a victim', () => {
    const multi: SystemState = {
      processes: [
        { id: 'P1', name: 'P1' },
        { id: 'P2', name: 'P2' },
      ],
      resources: [
        { id: 'R1', name: 'R1', totalInstances: 3 },
        { id: 'R2', name: 'R2', totalInstances: 1 },
      ],
      edges: [
        { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 3 },
        { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
        { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
        { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
      ],
    };
    const rec = executeRecovery(multi, 'PREEMPT_RESOURCE', {
      victimProcessId: 'P1',
      preemptResourceId: 'R1',
      preemptCount: 1,
    });
    const remaining = rec.result.newState.edges.find((e) => e.id === 'e1');
    expect(remaining?.count).toBe(2);
  });

  it('throws when preempting from a process holding no resources or unknown resource', () => {
    const deadlockedButHoldsNothing: SystemState = {
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
        { id: 'e5', type: 'request', from: 'P3', to: 'R1', count: 1 },
      ],
    };
    // P3 holds nothing but is deadlocked (blocked on P1). Preempting from P3 is impossible.
    expect(() =>
      executeRecovery(deadlockedButHoldsNothing, 'PREEMPT_RESOURCE', { victimProcessId: 'P3' })
    ).toThrowError(EngineError);

    expect(() =>
      executeRecovery(deadlocked, 'PREEMPT_RESOURCE', {
        victimProcessId: 'P1',
        preemptResourceId: 'R2',
      })
    ).toThrowError(EngineError);
  });
});

describe('Banker request coverage', () => {
  const state: SystemState = {
    processes: [{ id: 'P0', name: 'P0' }],
    resources: [
      { id: 'R0', name: 'R0', totalInstances: 3 },
      { id: 'R1', name: 'R1', totalInstances: 3 },
    ],
    edges: [],
    allocation: [[1, 0]],
    request: [[0, 0]],
    max: [[3, 0]],
    need: [[2, 0]],
    available: [2, 3],
  };

  it('throws for unknown process', () => {
    expect(() => evaluateBankersRequest(state, 'PX', [0, 0])).toThrowError(EngineError);
  });

  it('throws for wrong-length request vector', () => {
    expect(() => evaluateBankersRequest(state, 'P0', [0])).toThrowError(EngineError);
  });
});

describe('Simulator branch coverage', () => {
  it('grants after a release frees a resource, augmenting an existing assignment', () => {
    const state: SystemState = {
      processes: [
        { id: 'P0', name: 'P0' },
        { id: 'P1', name: 'P1' },
      ],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 2 }],
      edges: [{ id: 'a-R0-P0', type: 'assignment', from: 'R0', to: 'P0', count: 1 }],
    };

    const scripts: ProcessScript[] = [
      {
        processId: 'P0',
        instructions: [
          { type: 'request', resourceId: 'R0', count: 1 }, // augments existing assignment to 2
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R0', count: 2 }, // frees both instances
        ],
      },
      {
        processId: 'P1',
        instructions: [
          { type: 'request', resourceId: 'R0', count: 1 }, // blocked until P0 releases
          { type: 'compute', duration: 1 },
          { type: 'release', resourceId: 'R0', count: 1 },
        ],
      },
    ];

    const sim = new SimulatorEngine(
      state,
      scripts,
      { breakCircularWait: false, breakHoldAndWait: false, breakNoPreemption: false },
      30
    );

    let snap = sim.getSnapshot();
    for (let i = 0; i < 30 && !snap.isFinished; i++) {
      snap = sim.step();
    }

    expect(snap.events.some((e) => e.outcome === 'granted')).toBe(true);
    expect(snap.events.some((e) => e.outcome === 'blocked')).toBe(true);
    expect(snap.events.some((e) => e.outcome === 'released')).toBe(true);
    expect(snap.processStatuses.every((s) => s.state === 'Finished')).toBe(true);
  });

  it('no-preemption policy releases held resources and blocks the requester', () => {
    const state: SystemState = {
      processes: [
        { id: 'P0', name: 'P0' },
        { id: 'P1', name: 'P1' },
      ],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
      edges: [],
    };

    const scripts: ProcessScript[] = [
      {
        processId: 'P0',
        instructions: [
          { type: 'request', resourceId: 'R0', count: 1 }, // gets it
          { type: 'request', resourceId: 'R0', count: 1 }, // blocked by no-preemption -> preempts own held
        ],
      },
      { processId: 'P1', instructions: [] },
    ];

    const sim = new SimulatorEngine(
      state,
      scripts,
      { breakCircularWait: false, breakHoldAndWait: false, breakNoPreemption: true },
      10
    );

    let snap = sim.getSnapshot();
    for (let i = 0; i < 5; i++) {
      snap = sim.step();
    }

    const rejection = snap.events.find((e) => e.outcome === 'rejected_policy');
    expect(rejection).toBeDefined();
    expect(rejection?.policyNotice?.coffmanCondition).toBe('No Preemption');
  });

  it('process with no script finishes immediately', () => {
    const state: SystemState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
      edges: [],
    };
    const sim = new SimulatorEngine(
      state,
      [],
      { breakCircularWait: false, breakHoldAndWait: false, breakNoPreemption: false },
      5
    );
    const snap = sim.step();
    expect(snap.processStatuses[0]!.state).toBe('Finished');
    expect(snap.events.some((e) => e.outcome === 'finished')).toBe(true);
  });

  it('flags the tick at which deadlock first occurs and marks processes deadlocked', () => {
    const state: SystemState = {
      processes: [
        { id: 'P0', name: 'P0' },
        { id: 'P1', name: 'P1' },
      ],
      resources: [
        { id: 'R0', name: 'R0', totalInstances: 1 },
        { id: 'R1', name: 'R1', totalInstances: 1 },
      ],
      edges: [],
    };
    const scripts: ProcessScript[] = [
      {
        processId: 'P0',
        instructions: [
          { type: 'request', resourceId: 'R0', count: 1 },
          { type: 'request', resourceId: 'R1', count: 1 },
        ],
      },
      {
        processId: 'P1',
        instructions: [
          { type: 'request', resourceId: 'R1', count: 1 },
          { type: 'request', resourceId: 'R0', count: 1 },
        ],
      },
    ];
    const sim = new SimulatorEngine(
      state,
      scripts,
      { breakCircularWait: false, breakHoldAndWait: false, breakNoPreemption: false },
      20
    );
    let snap = sim.getSnapshot();
    for (let i = 0; i < 20 && !snap.isFinished; i++) {
      snap = sim.step();
    }
    expect(snap.deadlockDetectedAtTick).toBeDefined();
    expect(snap.processStatuses.every((s) => s.state === 'Deadlocked')).toBe(true);
  });
});

describe('Detection dispatcher coverage', () => {
  const single: SystemState = {
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

  it('auto-selects single-instance algorithm and honours explicit override', () => {
    const auto = detectDeadlock(single);
    expect(auto.result.algorithmUsed).toBe('single-instance-wfg');

    const override = detectDeadlock(single, 'multi-instance-matrix');
    expect(override.result.algorithmUsed).toBe('multi-instance-matrix');
    expect(override.result.hasDeadlock).toBe(true);
  });

  it('auto-selects multi-instance algorithm when resources have multiple instances', () => {
    const multi: SystemState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 3 }],
      edges: [],
    };
    const auto = detectDeadlock(multi);
    expect(auto.result.algorithmUsed).toBe('multi-instance-matrix');

    const override = detectDeadlock(multi, 'single-instance-wfg');
    expect(override.result.algorithmUsed).toBe('single-instance-wfg');
  });
});
