import { create } from 'zustand';
import {
  SystemState,
  DetectionResult,
  Step,
  EngineError,
} from '../engine/types';
import { detectDeadlock, isSingleInstanceSystem } from '../engine/detect';
import { deriveMatricesFromRAG } from '../engine/rag';
import { validateSystemState, MAX_PROCESSES, MAX_RESOURCES } from '../engine/validate';
import { autoLayout, ensurePositions, Positions } from '../lib/layout';
import { nextProcessId, nextResourceId, requestEdgeId, assignmentEdgeId } from '../lib/ids';
import { PRESETS } from '../scenarios/presets';

export type AlgorithmChoice = 'auto' | 'single-instance-wfg' | 'multi-instance-matrix';

export type TraceKind = 'detection' | 'banker-safety' | 'banker-request' | 'recovery' | 'simulation';


export interface DerivedMatrices {
  allocation: number[][];
  max: number[][];
  need: number[][];
  request: number[][];
  available: number[];
}

export type MatrixName = keyof DerivedMatrices;

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface LabState {
  // ---- scenario (single source of truth) ----
  scenarioName: string;
  scenarioId: string;
  scenario: SystemState;
  positions: Positions;

  // ---- ui ----
  selectedNodeId: string | null;
  algorithm: AlgorithmChoice;

  // ---- detection output ----
  detection: DetectionResult | null;
  detectionSteps: Step[];
  stepIndex: number;
  traceKind: TraceKind;

  // ---- feedback ----
  error: string | null;
  notice: string | null;

  // ---- history ----
  past: SystemState[];
  future: SystemState[];

  // ---- actions ----
  loadPreset: (presetId: string) => void;
  importScenario: (name: string, scenario: SystemState) => ActionResult;
  resetScenario: () => void;
  clearMessage: () => void;

  addProcess: () => ActionResult;
  removeProcess: (id: string) => ActionResult;
  renameProcess: (id: string, name: string) => void;

  addResource: () => ActionResult;
  removeResource: (id: string) => ActionResult;
  renameResource: (id: string, name: string) => void;
  setResourceInstances: (id: string, n: number) => ActionResult;

  addRequestEdge: (processId: string, resourceId: string, count: number) => ActionResult;
  addAssignmentEdge: (resourceId: string, processId: string, count: number) => ActionResult;
  removeEdge: (edgeId: string) => ActionResult;
  setEdgeCount: (edgeId: string, count: number) => ActionResult;

  setMatrixCell: (matrix: MatrixName, row: number, col: number, value: number) => ActionResult;

  selectNode: (id: string | null) => void;
  setNodePosition: (id: string, x: number, y: number) => void;
  runAutoLayout: () => void;

  setAlgorithm: (a: AlgorithmChoice) => void;

  runDetection: () => void;
  setStepIndex: (i: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTraceKind: (kind: TraceKind) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const EMPTY_SCENARIO: SystemState = {
  processes: [],
  resources: [],
  edges: [],
};

/** Normalizes a scenario so allocation/request/available are always derived, keeping only `max`. */
function normalizeScenario(input: SystemState): SystemState {
  return {
    processes: input.processes.map((p) => ({ ...p })),
    resources: input.resources.map((r) => ({ ...r })),
    edges: input.edges.map((e) => ({ ...e })),
    ...(input.max ? { max: input.max.map((row) => [...row]) } : {}),
  };
}

function formatEngineError(err: unknown): string {
  if (err instanceof EngineError) return err.message.replace(/^\[EngineError: [^\]]+\]\s*/, '');
  return (err as Error).message;
}

export const useLabStore = create<LabState>((set, get) => {
  /** Validates, records history, and commits a new scenario. */
  const commit = (next: SystemState, options?: { skipValidation?: boolean }): ActionResult => {
    try {
      if (!options?.skipValidation) validateSystemState(next);
    } catch (err) {
      return { ok: false, error: formatEngineError(err) };
    }
    set((state) => ({
      scenario: next,
      positions: ensurePositions(next, state.positions),
      past: [...state.past, state.scenario],
      future: [],
      error: null,
      // A scenario edit invalidates any previously replayed trace.
      detection: null,
      detectionSteps: [],
      stepIndex: 0,
    }));
    return { ok: true };
  };

  const initial = PRESETS['classic-deadlock']!;

  return {
    scenarioName: initial.name,
    scenarioId: 'classic-deadlock',
    scenario: normalizeScenario(initial.state),
    positions: autoLayout(initial.state),

    selectedNodeId: null,
    algorithm: 'auto',

    detection: null,
    detectionSteps: [],
    stepIndex: 0,
    traceKind: 'detection',

    error: null,
    notice: null,

    past: [],
    future: [],

    loadPreset: (presetId) => {
      const preset = PRESETS[presetId];
      if (!preset) {
        set({ error: `Unknown preset "${presetId}"` });
        return;
      }
      const normalized = normalizeScenario(preset.state);
      set({
        scenarioName: preset.name,
        scenarioId: presetId,
        scenario: normalized,
        positions: autoLayout(normalized),
        selectedNodeId: null,
        detection: null,
        detectionSteps: [],
        stepIndex: 0,
        error: null,
        notice: null,
        past: [],
        future: [],
      });
    },

    importScenario: (name, scenario) => {
      const normalized = normalizeScenario(scenario);
      try {
        validateSystemState(normalized);
      } catch (err) {
        return { ok: false, error: formatEngineError(err) };
      }
      set({
        scenarioName: name,
        scenarioId: 'custom',
        scenario: normalized,
        positions: autoLayout(normalized),
        selectedNodeId: null,
        detection: null,
        detectionSteps: [],
        stepIndex: 0,
        error: null,
        notice: 'Scenario imported successfully.',
        past: [],
        future: [],
      });
      return { ok: true };
    },

    resetScenario: () => {
      const normalized = normalizeScenario(EMPTY_SCENARIO);
      set({
        scenarioName: 'Untitled scenario',
        scenarioId: 'custom',
        scenario: normalized,
        positions: autoLayout(normalized),
        selectedNodeId: null,
        detection: null,
        detectionSteps: [],
        stepIndex: 0,
        error: null,
        notice: 'Scenario reset.',
        past: [],
        future: [],
      });
    },

    clearMessage: () => set({ error: null, notice: null }),

    addProcess: () => {
      const { scenario } = get();
      if (scenario.processes.length >= MAX_PROCESSES) {
        return { ok: false, error: `Process limit of ${MAX_PROCESSES} reached` };
      }
      const id = nextProcessId(scenario.processes);
      return commit({
        ...scenario,
        processes: [...scenario.processes, { id, name: `Process ${id.slice(1)}` }],
      });
    },

    removeProcess: (id) => {
      const { scenario } = get();
      return commit({
        ...scenario,
        processes: scenario.processes.filter((p) => p.id !== id),
        edges: scenario.edges.filter((e) => e.from !== id && e.to !== id),
        ...(scenario.max
          ? {
              max: scenario.processes
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => p.id !== id)
                .map(({ i }) => [...scenario.max![i]!]),
            }
          : {}),
      });
    },

    renameProcess: (id, name) => {
      const { scenario } = get();
      set({
        scenario: {
          ...scenario,
          processes: scenario.processes.map((p) => (p.id === id ? { ...p, name } : p)),
        },
      });
    },

    addResource: () => {
      const { scenario } = get();
      if (scenario.resources.length >= MAX_RESOURCES) {
        return { ok: false, error: `Resource limit of ${MAX_RESOURCES} reached` };
      }
      const id = nextResourceId(scenario.resources);
      return commit({
        ...scenario,
        resources: [...scenario.resources, { id, name: `Resource ${id.slice(1)}`, totalInstances: 1 }],
      });
    },

    removeResource: (id) => {
      const { scenario } = get();
      return commit({
        ...scenario,
        resources: scenario.resources.filter((r) => r.id !== id),
        edges: scenario.edges.filter((e) => e.from !== id && e.to !== id),
        ...(scenario.max
          ? {
              max: scenario.max.map((row) =>
                row.filter((_, j) => scenario.resources[j]!.id !== id)
              ),
            }
          : {}),
      });
    },

    renameResource: (id, name) => {
      const { scenario } = get();
      set({
        scenario: {
          ...scenario,
          resources: scenario.resources.map((r) => (r.id === id ? { ...r, name } : r)),
        },
      });
    },

    setResourceInstances: (id, n) => {
      const { scenario } = get();
      const resource = scenario.resources.find((r) => r.id === id);
      if (!resource) return { ok: false, error: `Resource ${id} not found` };
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        return { ok: false, error: 'Instances must be an integer between 1 and 10' };
      }
      // Ensure existing allocations still fit.
      const allocated = scenario.edges
        .filter((e) => e.type === 'assignment' && e.from === id)
        .reduce((sum, e) => sum + e.count, 0);
      if (n < allocated) {
        return { ok: false, error: `${allocated} instances of ${id} are allocated; cannot drop to ${n}` };
      }
      return commit({
        ...scenario,
        resources: scenario.resources.map((r) => (r.id === id ? { ...r, totalInstances: n } : r)),
      });
    },

    addRequestEdge: (processId, resourceId, count) => {
      const { scenario } = get();
      if (!Number.isInteger(count) || count < 1) {
        return { ok: false, error: 'Request count must be a positive integer' };
      }
      const existing = scenario.edges.find(
        (e) => e.type === 'request' && e.from === processId && e.to === resourceId
      );
      if (existing) {
        return get().setEdgeCount(existing.id, count);
      }
      // Request/Need cannot exceed declared Max.
      const maxCheck = checkRequestAgainstMax(scenario, processId, resourceId, count);
      if (!maxCheck.ok) return maxCheck;
      return commit({
        ...scenario,
        edges: [
          ...scenario.edges,
          { id: requestEdgeId(processId, resourceId), type: 'request', from: processId, to: resourceId, count },
        ],
      });
    },

    addAssignmentEdge: (resourceId, processId, count) => {
      const { scenario } = get();
      if (!Number.isInteger(count) || count < 1) {
        return { ok: false, error: 'Assignment count must be a positive integer' };
      }
      const resource = scenario.resources.find((r) => r.id === resourceId);
      if (!resource) return { ok: false, error: `Resource ${resourceId} not found` };

      const allocated = scenario.edges
        .filter((e) => e.type === 'assignment' && e.from === resourceId)
        .reduce((sum, e) => sum + e.count, 0);
      if (allocated + count > resource.totalInstances) {
        return {
          ok: false,
          error: `Cannot assign ${count}: only ${resource.totalInstances - allocated} of ${resourceId} free`,
        };
      }

      const existing = scenario.edges.find(
        (e) => e.type === 'assignment' && e.from === resourceId && e.to === processId
      );
      if (existing) {
        return get().setEdgeCount(existing.id, existing.count + count);
      }

      // Assignment cannot exceed declared Max either.
      const maxCheck = checkAllocationAgainstMax(scenario, processId, resourceId, count);
      if (!maxCheck.ok) return maxCheck;

      return commit({
        ...scenario,
        edges: [
          ...scenario.edges,
          { id: assignmentEdgeId(resourceId, processId), type: 'assignment', from: resourceId, to: processId, count },
        ],
      });
    },

    removeEdge: (edgeId) => {
      const { scenario } = get();
      const edge = scenario.edges.find((e) => e.id === edgeId);
      if (!edge) return { ok: false, error: `Edge ${edgeId} not found` };
      return commit({ ...scenario, edges: scenario.edges.filter((e) => e.id !== edgeId) });
    },

    setEdgeCount: (edgeId, count) => {
      const { scenario } = get();
      const edge = scenario.edges.find((e) => e.id === edgeId);
      if (!edge) return { ok: false, error: `Edge ${edgeId} not found` };
      if (count === 0) return get().removeEdge(edgeId);
      if (!Number.isInteger(count) || count < 1) {
        return { ok: false, error: 'Count must be a positive integer' };
      }
      if (edge.type === 'assignment') {
        const resource = scenario.resources.find((r) => r.id === edge.from)!;
        const otherAllocated = scenario.edges
          .filter((e) => e.type === 'assignment' && e.from === edge.from && e.id !== edgeId)
          .reduce((sum, e) => sum + e.count, 0);
        if (otherAllocated + count > resource.totalInstances) {
          return { ok: false, error: `Cannot set ${count}: only ${resource.totalInstances - otherAllocated} of ${edge.from} free` };
        }
        const maxCheck = checkAllocationAgainstMax(scenario, edge.to, edge.from, count);
        if (!maxCheck.ok) return maxCheck;
      } else {
        const maxCheck = checkRequestAgainstMax(scenario, edge.from, edge.to, count);
        if (!maxCheck.ok) return maxCheck;
      }
      return commit({
        ...scenario,
        edges: scenario.edges.map((e) => (e.id === edgeId ? { ...e, count } : e)),
      });
    },

    setMatrixCell: (matrix, row, col, value) => {
      const { scenario } = get();
      if (!Number.isInteger(value) || value < 0) {
        return { ok: false, error: 'Matrix values must be non-negative integers' };
      }
      const derived = deriveMatricesFromRAG(scenario);
      const process = scenario.processes[row];
      const resource = scenario.resources[col];
      if (!process || !resource) return { ok: false, error: 'Cell is out of range' };

      if (matrix === 'available') {
        return { ok: false, error: 'Available is derived from totals minus allocations' };
      }

      if (matrix === 'allocation') {
        const edge = scenario.edges.find(
          (e) => e.type === 'assignment' && e.from === resource.id && e.to === process.id
        );
        if (value === 0) return edge ? get().removeEdge(edge.id) : { ok: true };
        const otherAllocated = scenario.edges
          .filter((e) => e.type === 'assignment' && e.from === resource.id && e.to !== process.id)
          .reduce((sum, e) => sum + e.count, 0);
        if (otherAllocated + value > resource.totalInstances) {
          return { ok: false, error: `Only ${resource.totalInstances - otherAllocated} of ${resource.id} free` };
        }
        const maxCheck = checkAllocationAgainstMax(scenario, process.id, resource.id, value);
        if (!maxCheck.ok) return maxCheck;
        return upsertEdge(commit, scenario, 'assignment', resource.id, process.id, value);
      }

      if (matrix === 'request') {
        const edge = scenario.edges.find(
          (e) => e.type === 'request' && e.from === process.id && e.to === resource.id
        );
        if (value === 0) return edge ? get().removeEdge(edge.id) : { ok: true };
        const maxCheck = checkRequestAgainstMax(scenario, process.id, resource.id, value);
        if (!maxCheck.ok) return maxCheck;
        return upsertEdge(commit, scenario, 'request', process.id, resource.id, value);
      }

      if (matrix === 'max') {
        if (value < derived.allocation[row]![col]!) {
          return { ok: false, error: `Max cannot be below Allocation (${derived.allocation[row]![col]})` };
        }
        const max = derived.max!.map((r) => [...r]);
        max[row]![col] = value;
        return commit({ ...scenario, max });
      }

      // need → Max = Allocation + Need
      const max = derived.max!.map((r) => [...r]);
      max[row]![col] = derived.allocation[row]![col]! + value;
      return commit({ ...scenario, max });
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    setNodePosition: (id, x, y) =>
      set((state) => ({ positions: { ...state.positions, [id]: { x, y } } })),

    runAutoLayout: () => set((state) => ({ positions: autoLayout(state.scenario) })),

    setAlgorithm: (a) =>
      set({ algorithm: a, detection: null, detectionSteps: [], stepIndex: 0, traceKind: 'detection' }),

    runDetection: () => {
      const { scenario, algorithm } = get();
      try {
        validateSystemState(scenario);
      } catch (err) {
        set({ error: formatEngineError(err), detection: null, detectionSteps: [] });
        return;
      }
      const single = isSingleInstanceSystem(scenario);
      const override = algorithm === 'auto' ? undefined : algorithm;
      const trace = detectDeadlock(scenario, override);
      const inappropriate = algorithm === 'single-instance-wfg' && !single;

      set({
        detection: trace.result,
        detectionSteps: trace.steps,
        stepIndex: 0,
        traceKind: 'detection',
        error: null,
        notice: inappropriate
          ? 'Warning: Wait-For-Graph cycle detection assumes single-instance resources. This scenario has multi-instance resources, so results may be inaccurate.'
          : null,
      });
    },

    setStepIndex: (i) => {
      const { detectionSteps } = get();
      if (detectionSteps.length === 0) return;
      const clamped = Math.max(0, Math.min(i, detectionSteps.length - 1));
      set({ stepIndex: clamped });
    },

    nextStep: () => {
      const { stepIndex, detectionSteps } = get();
      if (detectionSteps.length === 0) return;
      set({ stepIndex: Math.min(stepIndex + 1, detectionSteps.length - 1) });
    },

    prevStep: () => {
      const { stepIndex } = get();
      set({ stepIndex: Math.max(stepIndex - 1, 0) });
    },

    setTraceKind: (kind) => set({ traceKind: kind }),

    undo: () => {
      const { past, scenario, positions } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1]!;
      set({
        scenario: previous,
        past: past.slice(0, -1),
        future: [scenario, ...get().future],
        positions: ensurePositions(previous, positions),
        detection: null,
        detectionSteps: [],
        stepIndex: 0,
        error: null,
      });
    },

    redo: () => {
      const { future, scenario, past, positions } = get();
      if (future.length === 0) return;
      const next = future[0]!;
      set({
        scenario: next,
        future: future.slice(1),
        past: [...past, scenario],
        positions: ensurePositions(next, positions),
        detection: null,
        detectionSteps: [],
        stepIndex: 0,
        error: null,
      });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});

function upsertEdge(
  commit: (next: SystemState, options?: { skipValidation?: boolean }) => ActionResult,
  scenario: SystemState,
  type: 'request' | 'assignment',
  from: string,
  to: string,
  count: number
): ActionResult {
  const existing = scenario.edges.find((e) => e.type === type && e.from === from && e.to === to);
  if (existing) {
    return commit({
      ...scenario,
      edges: scenario.edges.map((e) => (e.id === existing.id ? { ...e, count } : e)),
    });
  }
  const id = type === 'request' ? requestEdgeId(from, to) : assignmentEdgeId(from, to);
  return commit({ ...scenario, edges: [...scenario.edges, { id, type, from, to, count }] });
}

function checkRequestAgainstMax(
  scenario: SystemState,
  processId: string,
  resourceId: string,
  count: number
): ActionResult {
  if (!scenario.max) return { ok: true };
  const pIndex = scenario.processes.findIndex((p) => p.id === processId);
  const rIndex = scenario.resources.findIndex((r) => r.id === resourceId);
  const allocation = deriveMatricesFromRAG(scenario).allocation;
  const allocated = allocation[pIndex]![rIndex]!;
  const maxVal = scenario.max[pIndex]?.[rIndex] ?? allocated + count;
  if (allocated + count > maxVal) {
    return {
      ok: false,
      error: `Request + Allocation (${allocated + count}) exceeds declared Max (${maxVal}) for ${processId}/${resourceId}`,
    };
  }
  return { ok: true };
}

function checkAllocationAgainstMax(
  scenario: SystemState,
  processId: string,
  resourceId: string,
  count: number
): ActionResult {
  if (!scenario.max) return { ok: true };
  const pIndex = scenario.processes.findIndex((p) => p.id === processId);
  const rIndex = scenario.resources.findIndex((r) => r.id === resourceId);
  const maxVal = scenario.max[pIndex]?.[rIndex];
  if (maxVal !== undefined && count > maxVal) {
    return { ok: false, error: `Allocation (${count}) exceeds declared Max (${maxVal}) for ${processId}/${resourceId}` };
  }
  return { ok: true };
}
