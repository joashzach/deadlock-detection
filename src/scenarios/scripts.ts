/**
 * Script library for the live simulator.
 *
 * Each preset ships with a hand-crafted script that demonstrates something
 * specific (a deadlock, a clean completion, or a resolution under a prevention
 * policy). Arbitrary scenarios get a deterministic generated script.
 */
import { Edge, ProcessScript, SimulatorScriptCommand, SystemState } from '../engine/types';

const req = (resourceId: string, count = 1): SimulatorScriptCommand => ({
  type: 'request',
  resourceId,
  count,
});
const rel = (resourceId: string, count = 1): SimulatorScriptCommand => ({
  type: 'release',
  resourceId,
  count,
});
const compute = (duration = 1): SimulatorScriptCommand => ({ type: 'compute', duration });

/**
 * Assembles one script per process: request set → compute → release everything it
 * could be holding (both what it started with and what it asked for). Releasing the
 * requested resources too is what lets a prevented run actually finish rather than
 * ending with processes still holding what they acquired.
 */
function build(
  state: SystemState,
  requests: Record<string, Array<[string, number]>>
): ProcessScript[] {
  return state.processes.map((p) => {
    const wanted = requests[p.id] ?? [];
    const held = state.edges
      .filter((e: Edge) => e.type === 'assignment' && e.to === p.id && e.count > 0)
      .map((e) => e.from);
    const releaseIds = [...new Set([...held, ...wanted.map(([resourceId]) => resourceId)])].sort();

    return {
      processId: p.id,
      instructions: [
        ...wanted.map(([resourceId, count]) => req(resourceId, count)),
        compute(1),
        ...releaseIds.map((resourceId) => rel(resourceId, 1)),
      ],
    };
  });
}

/** Hand-crafted scripts for the shipped presets. */
export const SCRIPT_LIBRARY: Record<string, (state: SystemState) => ProcessScript[]> = {
  'classic-deadlock': (s) => build(s, { P1: [['R2', 1]], P2: [['R1', 1]] }),

  'safe-chain': (s) => build(s, { P1: [['R2', 1]], P2: [] }),

  'circular-wait-3': (s) =>
    build(s, { P1: [['R2', 1]], P2: [['R3', 1]], P3: [['R1', 1]] }),

  // All requests land on resources with enough free instances, so it completes.
  'bankers-safe': (s) =>
    build(s, {
      P0: [['R0', 1]],
      P1: [['R1', 1]],
      P2: [['R0', 1]],
      P3: [['R1', 1]],
      P4: [['R0', 1]],
    }),

  // Available is [0,0,0] — only releases make progress, so it always completes.
  'multi-safe': (s) => build(s, {}),

  // Every request is unfulfillable → P2↔P3 form a cycle → deadlock.
  'multi-deadlock': (s) =>
    build(s, {
      P1: [
        ['R0', 2],
        ['R2', 2],
      ],
      P2: [['R2', 1]],
      P3: [['R0', 1]],
      P4: [['R2', 2]],
    }),

  // The classic naive dining philosophers: everyone reaches for their right-hand
  // fork while holding the left. Deadlocks with no policy; the resource-ordering
  // policy denies P4's backwards request and the run completes.
  'dining-philosophers': (s) =>
    build(s, {
      P0: [['R1', 1]],
      P1: [['R2', 1]],
      P2: [['R3', 1]],
      P3: [['R4', 1]],
      P4: [['R0', 1]],
    }),
};

/** Deterministic fallback script for custom scenarios. */
export function defaultScripts(state: SystemState): ProcessScript[] {
  const requests: Record<string, Array<[string, number]>> = {};
  for (const p of state.processes) {
    const held = new Set(
      state.edges
        .filter((e: Edge) => e.type === 'assignment' && e.to === p.id && e.count > 0)
        .map((e) => e.from)
    );
    requests[p.id] = state.resources
      .filter((r) => !held.has(r.id))
      .map((r) => [r.id, 1] as [string, number]);
  }
  return build(state, requests);
}

/** Returns the preset script when one exists, otherwise a generated script. */
export function scriptsForPreset(presetId: string, state: SystemState): ProcessScript[] {
  const factory = SCRIPT_LIBRARY[presetId];
  return factory ? factory(state) : defaultScripts(state);
}

/**
 * Keeps a script list in step with the current scenario: adds scripts for new
 * processes, drops scripts for removed ones, and repairs references to resources
 * that no longer exist.
 */
export function reconcileScripts(scripts: ProcessScript[], state: SystemState): ProcessScript[] {
  const resourceIds = new Set(state.resources.map((r) => r.id));
  const byProcess = new Map(scripts.map((s) => [s.processId, s]));
  return state.processes.map((p) => {
    const existing = byProcess.get(p.id);
    if (!existing) {
      return { processId: p.id, instructions: [compute(1)] };
    }
    return {
      processId: p.id,
      instructions: existing.instructions.filter(
        (i) => i.type === 'compute' || resourceIds.has(i.resourceId)
      ),
    };
  });
}
