import { describe, it, expect } from 'vitest';
import {
  SystemState,
  Edge,
  detectCycleSingleInstance,
  detectMatrixMultiInstance,
  checkBankersSafety,
  evaluateBankersRequest,
  deriveMatricesFromRAG,
  SimulatorEngine,
  ProcessScript,
} from '../../src/engine';

// Deterministic PRNG: Mulberry32
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Engine Property and Invariant Tests', () => {
  // Cross-check property test: 500 seeded random single-instance scenarios
  // - cycle detector and matrix detector agree that deadlock exists/doesn't
  // - cycle members ⊆ matrix deadlocked set
  // - deadlocked set = cycle members plus processes that can reach a cycle in the WFG
  it('Property Test: 500 seeded single-instance scenarios match between cycle and matrix detectors', () => {
    const rng = mulberry32(1337);

    for (let run = 0; run < 500; run++) {
      const pCount = Math.floor(rng() * 4) + 2; // 2 to 5 processes
      const rCount = Math.floor(rng() * 4) + 2; // 2 to 5 resources

      const processes = Array.from({ length: pCount }, (_, i) => ({
        id: `P${i}`,
        name: `Process ${i}`,
      }));

      const resources = Array.from({ length: rCount }, (_, j) => ({
        id: `R${j}`,
        name: `Resource ${j}`,
        totalInstances: 1, // Single instance
      }));

      // Random allocations: each resource can be assigned to at most 1 process
      const edges: Edge[] = [];
      const assignedResources = new Set<string>();

      for (const res of resources) {
        if (rng() < 0.7) {
          const p = processes[Math.floor(rng() * pCount)]!;
          edges.push({
            id: `a-${res.id}-${p.id}`,
            type: 'assignment',
            from: res.id,
            to: p.id,
            count: 1,
          });
          assignedResources.add(res.id);
        }
      }

      // Random requests: a process can request available or assigned resources
      const reqSet = new Set<string>();
      for (const p of processes) {
        for (const res of resources) {
          // Can't request what it already holds
          const holds = edges.some(
            (e) => e.type === 'assignment' && e.from === res.id && e.to === p.id
          );
          if (!holds && rng() < 0.35) {
            const key = `${p.id}->${res.id}`;
            if (!reqSet.has(key)) {
              reqSet.add(key);
              edges.push({
                id: `r-${p.id}-${res.id}`,
                type: 'request',
                from: p.id,
                to: res.id,
                count: 1,
              });
            }
          }
        }
      }

      const state: SystemState = { processes, resources, edges };

      // Invariant: Available = Total - sum(alloc)
      const matrices = deriveMatricesFromRAG(state);
      for (let j = 0; j < rCount; j++) {
        let sumAlloc = 0;
        for (let i = 0; i < pCount; i++) {
          sumAlloc += matrices.allocation[i]![j]!;
        }
        expect(matrices.available[j]).toBe(resources[j]!.totalInstances - sumAlloc);
      }

      const cycleRes = detectCycleSingleInstance(state);
      const matrixRes = detectMatrixMultiInstance(state);

      // Invariant 1: Cycle detector and matrix detector agree that deadlock exists/doesn't
      expect(cycleRes.result.hasDeadlock).toBe(matrixRes.result.hasDeadlock);

      // Invariant 2: Cycle members ⊆ matrix deadlocked set
      for (const cm of cycleRes.result.cycleMemberIds) {
        expect(matrixRes.result.deadlockedProcessIds).toContain(cm);
      }

      // Invariant 3: Deadlocked set in cycle detector matches matrix deadlocked set
      expect(cycleRes.result.deadlockedProcessIds.sort()).toEqual(
        matrixRes.result.deadlockedProcessIds.sort()
      );

      // Invariant 4: Traces are non-empty and end with conclusion
      expect(cycleRes.steps.length).toBeGreaterThan(0);
      expect(cycleRes.steps[cycleRes.steps.length - 1]!.title).toContain('Conclusion');
      expect(matrixRes.steps.length).toBeGreaterThan(0);
      expect(matrixRes.steps[matrixRes.steps.length - 1]!.title).toContain('Conclusion');
    }
  });

  // Banker's property test: for 200 random states, a granted request always leaves the state safe
  it("Property Test: Banker's algorithm granted request always leaves state safe (200 trials)", () => {
    const rng = mulberry32(4242);

    for (let trial = 0; trial < 200; trial++) {
      const pCount = 3;
      const rCount = 2;

      const processes = Array.from({ length: pCount }, (_, i) => ({
        id: `P${i}`,
        name: `P${i}`,
      }));

      const resources = Array.from({ length: rCount }, (_, j) => ({
        id: `R${j}`,
        name: `R${j}`,
        totalInstances: 8,
      }));

      // Generate random safe state
      // Max between 1 and 6
      const max: number[][] = Array.from({ length: pCount }, () =>
        Array.from({ length: rCount }, () => Math.floor(rng() * 5) + 1)
      );

      // Allocation <= Max
      const allocation: number[][] = Array.from({ length: pCount }, (_, i) =>
        Array.from({ length: rCount }, (_, j) => Math.floor(rng() * (max[i]![j]! / 2 + 1)))
      );

      const need: number[][] = Array.from({ length: pCount }, (_, i) =>
        Array.from({ length: rCount }, (_, j) => max[i]![j]! - allocation[i]![j]!)
      );

      const available: number[] = Array.from({ length: rCount }, (_, j) => {
        let sum = 0;
        for (let i = 0; i < pCount; i++) sum += allocation[i]![j]!;
        return resources[j]!.totalInstances - sum;
      });

      // Build edges
      const edges: Edge[] = [];
      for (let i = 0; i < pCount; i++) {
        for (let j = 0; j < rCount; j++) {
          if (allocation[i]![j]! > 0) {
            edges.push({
              id: `a-${resources[j]!.id}-${processes[i]!.id}`,
              type: 'assignment',
              from: resources[j]!.id,
              to: processes[i]!.id,
              count: allocation[i]![j]!,
            });
          }
        }
      }

      const state: SystemState = {
        processes,
        resources,
        edges,
        allocation,
        max,
        need,
        available,
      };

      // Random process requests a vector <= its need
      const pIdx = Math.floor(rng() * pCount);
      const reqVector = Array.from({ length: rCount }, (_, j) => {
        const pNeed = need[pIdx]![j]!;
        return Math.floor(rng() * (pNeed + 1));
      });

      const evalRes = evaluateBankersRequest(state, processes[pIdx]!.id, reqVector);

      // If granted, test that updated state IS actually safe!
      if (evalRes.result.outcome === 'GRANTED') {
        const nextState = evalRes.result.updatedState!;
        const safetyCheck = checkBankersSafety(nextState);
        expect(safetyCheck.result.isSafe).toBe(true);
      }
    }
  });

  it('Invariant: Determinism — same seed yields identical step trace and results', () => {
    const scripts: ProcessScript[] = [
      {
        processId: 'P1',
        instructions: [
          { type: 'request', resourceId: 'R1', count: 1 },
          { type: 'compute', duration: 2 },
          { type: 'release', resourceId: 'R1', count: 1 },
        ],
      },
    ];

    const state: SystemState = {
      processes: [{ id: 'P1', name: 'P1' }],
      resources: [{ id: 'R1', name: 'R1', totalInstances: 1 }],
      edges: [],
    };

    const sim1 = new SimulatorEngine(state, scripts, {
      breakCircularWait: false,
      breakHoldAndWait: false,
      breakNoPreemption: false,
    });

    const sim2 = new SimulatorEngine(state, scripts, {
      breakCircularWait: false,
      breakHoldAndWait: false,
      breakNoPreemption: false,
    });

    for (let i = 0; i < 5; i++) {
      const snap1 = sim1.step();
      const snap2 = sim2.step();
      expect(snap1.tick).toBe(snap2.tick);
      expect(snap1.events).toEqual(snap2.events);
    }
  });

  it('Invariant: Simulator always terminates within maxTicks guard', () => {
    const state: SystemState = {
      processes: [{ id: 'P1', name: 'P1' }],
      resources: [{ id: 'R1', name: 'R1', totalInstances: 1 }],
      edges: [],
    };

    const infiniteScripts: ProcessScript[] = [
      {
        processId: 'P1',
        instructions: [
          { type: 'compute', duration: 1000 },
        ],
      },
    ];

    const maxTicks = 15;
    const sim = new SimulatorEngine(
      state,
      infiniteScripts,
      {
        breakCircularWait: false,
        breakHoldAndWait: false,
        breakNoPreemption: false,
      },
      maxTicks
    );

    let snap = sim.getSnapshot();
    for (let i = 0; i < 30; i++) {
      snap = sim.step();
    }

    expect(snap.tick).toBe(maxTicks);
    expect(snap.isFinished).toBe(true);
  });
});
