import { create } from 'zustand';
import {
  SystemState,
  DetectionResult,
  Step,
  EngineError,
  PreventionPolicies,
  ProcessScript,
  SimulatorScriptCommand,
  BankersSafetyResult,
  BankersRequestResult,
  RecoveryResult,
  RecoveryStrategy,
} from '../engine/types';
import { detectDeadlock, isSingleInstanceSystem } from '../engine/detect';
import { deriveMatricesFromRAG } from '../engine/rag';
import { validateSystemState, MAX_PROCESSES, MAX_RESOURCES } from '../engine/validate';
import { checkBankersSafety, evaluateBankersRequest } from '../engine/avoid/bankers';
import { executeRecovery } from '../engine/recover/recovery';
import { SimulatorEngine, SimulatorState } from '../engine/simulator';
import { autoLayout, ensurePositions, Positions } from '../lib/layout';
import { nextProcessId, nextResourceId, requestEdgeId, assignmentEdgeId } from '../lib/ids';
import { PRESETS } from '../scenarios/presets';
import {
  scriptsForPreset,
  defaultScripts,
  reconcileScripts,
} from '../scenarios/scripts';

export type AlgorithmChoice = 'auto' | 'single-instance-wfg' | 'multi-instance-matrix';

export type TraceKind = 'detection' | 'banker-safety' | 'banker-request' | 'recovery' | 'simulation';

/** Which centre-panel workspace is showing. */
export type LabMode = 'graph' | 'simulate';

export interface DerivedMatrices {
  allocation: number[][];
  max: number[][];
  need: number[][];
  request: number[][];
  available: number[];
}

export type MatrixName = keyof DerivedMatrices;

export interface SimulatorPair {
  baseline: SimulatorState;
  policied: SimulatorState;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

export const DEFAULT_POLICIES: PreventionPolicies = {
  breakHoldAndWait: false,
  breakNoPreemption: false,
  breakCircularWait: false,
};

interface LabState {
  // ---- scenario (single source of truth) ----
  scenarioName: string;
  scenarioId: string;
  scenario: SystemState;
  positions: Positions;

  // ---- ui ----
  selectedNodeId: string | null;
  algorithm: AlgorithmChoice;
  labMode: LabMode;
  /** Whether the keyboard-shortcuts dialog is showing (toggled with `?`). */
  shortcutsOpen: boolean;

  // ---- active trace (played back by the playback bar + right panel) ----
  traceKind: TraceKind;
  traceSteps: Step[];
  stepIndex: number;
  isPlaying: boolean;
  speed: number; // 0.25 .. 4
  detection: DetectionResult | null;

  // ---- algorithm results ----
  safetyResult: BankersSafetyResult | null;
  requestResult: BankersRequestResult | null;
  recoveryResult: RecoveryResult | null;

  // ---- live simulator ----
  policies: PreventionPolicies;
  scripts: ProcessScript[];
  seed: number;
  simulator: SimulatorPair | null;

  // ---- feedback ----
  error: string | null;
  notice: string | null;

  // ---- history ----
  past: SystemState[];
  future: SystemState[];

  // ---- actions: scenario ----
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

  // ---- actions: ui ----
  setAlgorithm: (a: AlgorithmChoice) => void;
  setLabMode: (mode: LabMode) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleShortcuts: () => void;

  // ---- actions: playback ----
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setSpeed: (speed: number) => void;
  setStepIndex: (i: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // ---- actions: algorithms ----
  runDetection: () => void;
  runSafety: () => void;
  submitBankersRequest: (processId: string, vector: number[]) => void;
  applyRecovery: (
    strategy: RecoveryStrategy,
    options?: { victimProcessId?: string; preemptResourceId?: string; preemptCount?: number }
  ) => void;
  clearTrace: () => void;

  // ---- actions: live simulator ----
  setPolicies: (patch: Partial<PreventionPolicies>) => void;
  setSeed: (seed: number) => void;
  setScripts: (scripts: ProcessScript[]) => void;
  resetScriptsFromLibrary: () => void;
  updateScriptInstruction: (
    processId: string,
    index: number,
    instruction: SimulatorScriptCommand
  ) => void;
  addScriptInstruction: (processId: string, instruction: SimulatorScriptCommand) => void;
  removeScriptInstruction: (processId: string, index: number) => void;

  initSimulator: () => void;
  stepSimulator: () => void;
  stepSimulatorCount: (ticks: number) => void;
  resetSimulator: () => void;

  // ---- history ----
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const EMPTY_SCENARIO: SystemState = { processes: [], resources: [], edges: [] };

/**
 * Simulator engines live outside React state (they are mutable class instances),
 * while their plain-object snapshots are held in the store for rendering.
 */
let simulatorEngines: { baseline: SimulatorEngine | null; policied: SimulatorEngine | null } = {
  baseline: null,
  policied: null,
};

const SIM_MAX_TICKS = 400;

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
  /** Validates, records history, and commits a new scenario. Clears the active trace. */
  const commit = (next: SystemState): ActionResult => {
    try {
      validateSystemState(next);
    } catch (err) {
      return { ok: false, error: formatEngineError(err) };
    }
    set((state) => ({
      scenario: next,
      positions: ensurePositions(next, state.positions),
      scripts: reconcileScripts(state.scripts, next),
      past: [...state.past, state.scenario],
      future: [],
      error: null,
      // A scenario edit invalidates any previously replayed trace.
      detection: null,
      traceSteps: [],
      stepIndex: 0,
      isPlaying: false,
      safetyResult: null,
      requestResult: null,
      recoveryResult: null,
      simulator: null,
    }));
    simulatorEngines = { baseline: null, policied: null };
    return { ok: true };
  };

  /**
   * Applies a scenario produced by an algorithm without discarding the trace that
   * produced it (used when Banker's grants a request or recovery changes the state).
   */
  const commitFromAlgorithm = (next: SystemState): void => {
    set((state) => ({
      scenario: next,
      positions: ensurePositions(next, state.positions),
      scripts: reconcileScripts(state.scripts, next),
      past: [...state.past, state.scenario],
      future: [],
      simulator: null,
    }));
    simulatorEngines = { baseline: null, policied: null };
  };

  const initialPreset = PRESETS['classic-deadlock']!;
  const initialScenario = normalizeScenario(initialPreset.state);

  return {
    scenarioName: initialPreset.name,
    scenarioId: 'classic-deadlock',
    scenario: initialScenario,
    positions: autoLayout(initialScenario),

    selectedNodeId: null,
    algorithm: 'auto',
    labMode: 'graph',
    shortcutsOpen: false,

    traceKind: 'detection',
    traceSteps: [],
    stepIndex: 0,
    isPlaying: false,
    speed: 1,
    detection: null,

    safetyResult: null,
    requestResult: null,
    recoveryResult: null,

    policies: { ...DEFAULT_POLICIES },
    scripts: scriptsForPreset('classic-deadlock', initialPreset.state),
    seed: 1,
    simulator: null,

    error: null,
    notice: null,

    past: [],
    future: [],

    // ---------------- scenario ----------------

    loadPreset: (presetId) => {
      const preset = PRESETS[presetId];
      if (!preset) {
        set({ error: `Unknown preset "${presetId}"` });
        return;
      }
      const normalized = normalizeScenario(preset.state);
      simulatorEngines = { baseline: null, policied: null };
      set({
        scenarioName: preset.name,
        scenarioId: presetId,
        scenario: normalized,
        positions: autoLayout(normalized),
        selectedNodeId: null,
        detection: null,
        traceSteps: [],
        stepIndex: 0,
        isPlaying: false,
        traceKind: 'detection',
        safetyResult: null,
        requestResult: null,
        recoveryResult: null,
        scripts: scriptsForPreset(presetId, preset.state),
        simulator: null,
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
      simulatorEngines = { baseline: null, policied: null };
      set({
        scenarioName: name,
        scenarioId: 'custom',
        scenario: normalized,
        positions: autoLayout(normalized),
        selectedNodeId: null,
        detection: null,
        traceSteps: [],
        stepIndex: 0,
        isPlaying: false,
        safetyResult: null,
        requestResult: null,
        recoveryResult: null,
        scripts: defaultScripts(normalized),
        simulator: null,
        error: null,
        notice: 'Scenario imported successfully.',
        past: [],
        future: [],
      });
      return { ok: true };
    },

    resetScenario: () => {
      const normalized = normalizeScenario(EMPTY_SCENARIO);
      simulatorEngines = { baseline: null, policied: null };
      set({
        scenarioName: 'Untitled scenario',
        scenarioId: 'custom',
        scenario: normalized,
        positions: autoLayout(normalized),
        selectedNodeId: null,
        detection: null,
        traceSteps: [],
        stepIndex: 0,
        isPlaying: false,
        safetyResult: null,
        requestResult: null,
        recoveryResult: null,
        scripts: [],
        simulator: null,
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
        resources: [
          ...scenario.resources,
          { id, name: `Resource ${id.slice(1)}`, totalInstances: 1 },
        ],
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
      const allocated = scenario.edges
        .filter((e) => e.type === 'assignment' && e.from === id)
        .reduce((sum, e) => sum + e.count, 0);
      if (n < allocated) {
        return {
          ok: false,
          error: `${allocated} instances of ${id} are allocated; cannot drop to ${n}`,
        };
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
      const maxCheck = checkRequestAgainstMax(scenario, processId, resourceId, count);
      if (!maxCheck.ok) return maxCheck;
      return commit({
        ...scenario,
        edges: [
          ...scenario.edges,
          {
            id: requestEdgeId(processId, resourceId),
            type: 'request',
            from: processId,
            to: resourceId,
            count,
          },
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

      const maxCheck = checkAllocationAgainstMax(scenario, processId, resourceId, count);
      if (!maxCheck.ok) return maxCheck;

      return commit({
        ...scenario,
        edges: [
          ...scenario.edges,
          {
            id: assignmentEdgeId(resourceId, processId),
            type: 'assignment',
            from: resourceId,
            to: processId,
            count,
          },
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
          return {
            ok: false,
            error: `Cannot set ${count}: only ${resource.totalInstances - otherAllocated} of ${edge.from} free`,
          };
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
          return {
            ok: false,
            error: `Only ${resource.totalInstances - otherAllocated} of ${resource.id} free`,
          };
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
          return {
            ok: false,
            error: `Max cannot be below Allocation (${derived.allocation[row]![col]})`,
          };
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

    // ---------------- ui ----------------

    setAlgorithm: (a) => set({ algorithm: a }),

    setLabMode: (mode) => set({ labMode: mode, isPlaying: false }),
    setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
    toggleShortcuts: () => set((state) => ({ shortcutsOpen: !state.shortcutsOpen })),

    // ---------------- playback ----------------

    setPlaying: (playing) => set({ isPlaying: playing }),
    togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setSpeed: (speed) => set({ speed: Math.max(0.25, Math.min(4, speed)) }),

    setStepIndex: (i) => {
      const { traceSteps } = get();
      if (traceSteps.length === 0) return;
      const clamped = Math.max(0, Math.min(i, traceSteps.length - 1));
      set({ stepIndex: clamped });
    },

    nextStep: () => {
      const { stepIndex, traceSteps } = get();
      if (traceSteps.length === 0) return;
      set({ stepIndex: Math.min(stepIndex + 1, traceSteps.length - 1) });
    },

    prevStep: () => {
      const { stepIndex } = get();
      set({ stepIndex: Math.max(stepIndex - 1, 0) });
    },

    // ---------------- algorithms ----------------

    runDetection: () => {
      const { scenario, algorithm } = get();
      try {
        validateSystemState(scenario);
      } catch (err) {
        set({ error: formatEngineError(err), detection: null, traceSteps: [] });
        return;
      }
      const single = isSingleInstanceSystem(scenario);
      const override = algorithm === 'auto' ? undefined : algorithm;
      const trace = detectDeadlock(scenario, override);
      const inappropriate = algorithm === 'single-instance-wfg' && !single;

      set({
        detection: trace.result,
        traceSteps: trace.steps,
        traceKind: 'detection',
        stepIndex: 0,
        isPlaying: false,
        safetyResult: null,
        requestResult: null,
        recoveryResult: null,
        error: null,
        notice: inappropriate
          ? 'Warning: Wait-For-Graph cycle detection assumes single-instance resources. This scenario has multi-instance resources, so results may be inaccurate.'
          : null,
      });
    },

    runSafety: () => {
      const { scenario } = get();
      try {
        validateSystemState(scenario);
      } catch (err) {
        set({ error: formatEngineError(err) });
        return;
      }
      const trace = checkBankersSafety(scenario);
      set({
        safetyResult: trace.result,
        requestResult: null,
        traceSteps: trace.steps,
        traceKind: 'banker-safety',
        stepIndex: 0,
        isPlaying: false,
        detection: detectDeadlock(scenario).result,
        error: null,
        notice: trace.result.isSafe
          ? `Safe state. A valid sequence is <${trace.result.safeSequence?.join(', ')}>.`
          : 'Unsafe state: no complete safe sequence exists.',
      });
    },

    submitBankersRequest: (processId, vector) => {
      const { scenario } = get();
      try {
        validateSystemState(scenario);
      } catch (err) {
        set({ error: formatEngineError(err) });
        return;
      }
      const trace = evaluateBankersRequest(scenario, processId, vector);
      const outcome = trace.result.outcome;

      if (outcome === 'GRANTED' && trace.result.updatedState) {
        commitFromAlgorithm(normalizeScenario(trace.result.updatedState));
      }

      const effective = get().scenario;
      set({
        requestResult: trace.result,
        traceSteps: trace.steps,
        traceKind: 'banker-request',
        stepIndex: 0,
        isPlaying: false,
        detection: detectDeadlock(effective).result,
        error: null,
        notice: trace.result.message,
      });
    },

    applyRecovery: (strategy, options) => {
      const { scenario } = get();
      try {
        validateSystemState(scenario);
      } catch (err) {
        set({ error: formatEngineError(err) });
        return;
      }
      let trace;
      try {
        trace = executeRecovery(scenario, strategy, options);
      } catch (err) {
        set({ error: formatEngineError(err) });
        return;
      }

      commitFromAlgorithm(normalizeScenario(trace.result.newState));
      set({
        recoveryResult: trace.result,
        traceSteps: trace.steps,
        traceKind: 'recovery',
        stepIndex: 0,
        isPlaying: false,
        detection: trace.result.postDetection,
        safetyResult: null,
        requestResult: null,
        error: null,
        notice: trace.result.resolved
          ? 'Recovery complete: re-detection confirms the deadlock is resolved.'
          : 'Deadlock persists — apply another recovery step.',
      });
    },

    clearTrace: () =>
      set({
        traceSteps: [],
        stepIndex: 0,
        isPlaying: false,
        detection: null,
        safetyResult: null,
        requestResult: null,
        recoveryResult: null,
        notice: null,
      }),

    // ---------------- live simulator ----------------

    setPolicies: (patch) => {
      set((state) => ({ policies: { ...state.policies, ...patch }, simulator: null }));
      simulatorEngines = { baseline: null, policied: null };
    },

    setSeed: (seed) => set({ seed }),

    setScripts: (scripts) => {
      set({ scripts, simulator: null });
      simulatorEngines = { baseline: null, policied: null };
    },

    resetScriptsFromLibrary: () => {
      const { scenarioId, scenario } = get();
      set({ scripts: scriptsForPreset(scenarioId, scenario), simulator: null });
      simulatorEngines = { baseline: null, policied: null };
    },

    updateScriptInstruction: (processId, index, instruction) =>
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.processId === processId
            ? { ...s, instructions: s.instructions.map((ins, i) => (i === index ? instruction : ins)) }
            : s
        ),
        simulator: null,
      })),

    addScriptInstruction: (processId, instruction) =>
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.processId === processId
            ? { ...s, instructions: [...s.instructions, instruction] }
            : s
        ),
        simulator: null,
      })),

    removeScriptInstruction: (processId, index) =>
      set((state) => ({
        scripts: state.scripts.map((s) =>
          s.processId === processId
            ? { ...s, instructions: s.instructions.filter((_, i) => i !== index) }
            : s
        ),
        simulator: null,
      })),

    initSimulator: () => {
      const { scenario, scripts, policies } = get();
      try {
        validateSystemState(scenario);
      } catch (err) {
        set({ error: formatEngineError(err) });
        return;
      }
      // A simulation starts at tick 0: processes hold what the scenario assigns but
      // have no outstanding requests yet — the scripts issue those. Keeping the
      // scenario's pre-existing request edges would pre-load a wait state that the
      // prevention policies never got to inspect (e.g. it would leave the dining
      // philosophers already deadlocked, defeating the resource-ordering demo).
      const initialState: SystemState = {
        ...scenario,
        edges: scenario.edges.filter((e) => e.type === 'assignment'),
      };

      const baseline = new SimulatorEngine(initialState, scripts, { ...DEFAULT_POLICIES }, SIM_MAX_TICKS);
      const policied = new SimulatorEngine(initialState, scripts, { ...policies }, SIM_MAX_TICKS);
      simulatorEngines = { baseline, policied };
      set({
        simulator: {
          baseline: baseline.getSnapshot(),
          policied: policied.getSnapshot(),
        },
        error: null,
      });
    },

    stepSimulator: () => {
      const engines = simulatorEngines;
      if (!engines.baseline || !engines.policied) {
        get().initSimulator();
        return;
      }
      const baseline = engines.baseline.getSnapshot();
      if (!baseline.isFinished) engines.baseline.step();
      const policied = engines.policied.getSnapshot();
      if (!policied.isFinished) engines.policied.step();
      set({
        simulator: {
          baseline: engines.baseline.getSnapshot(),
          policied: engines.policied.getSnapshot(),
        },
      });
    },

    stepSimulatorCount: (ticks) => {
      for (let i = 0; i < ticks; i++) {
        const snapshot = get().simulator;
        if (snapshot && snapshot.baseline.isFinished && snapshot.policied.isFinished) break;
        get().stepSimulator();
      }
    },

    resetSimulator: () => {
      simulatorEngines = { baseline: null, policied: null };
      set({ simulator: null, isPlaying: false });
      get().initSimulator();
    },

    // ---------------- history ----------------

    undo: () => {
      const { past, scenario, positions } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1]!;
      simulatorEngines = { baseline: null, policied: null };
      set({
        scenario: previous,
        past: past.slice(0, -1),
        future: [scenario, ...get().future],
        positions: ensurePositions(previous, positions),
        scripts: reconcileScripts(get().scripts, previous),
        detection: null,
        traceSteps: [],
        stepIndex: 0,
        isPlaying: false,
        simulator: null,
        error: null,
      });
    },

    redo: () => {
      const { future, scenario, past, positions } = get();
      if (future.length === 0) return;
      const next = future[0]!;
      simulatorEngines = { baseline: null, policied: null };
      set({
        scenario: next,
        future: future.slice(1),
        past: [...past, scenario],
        positions: ensurePositions(next, positions),
        scripts: reconcileScripts(get().scripts, next),
        detection: null,
        traceSteps: [],
        stepIndex: 0,
        isPlaying: false,
        simulator: null,
        error: null,
      });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});

function upsertEdge(
  commit: (next: SystemState) => ActionResult,
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
    return {
      ok: false,
      error: `Allocation (${count}) exceeds declared Max (${maxVal}) for ${processId}/${resourceId}`,
    };
  }
  return { ok: true };
}

/** Validates a Banker's request vector before it reaches the engine. */
export function isValidRequestVector(scenario: SystemState, vector: number[]): boolean {
  return (
    vector.length === scenario.resources.length &&
    vector.every((v) => Number.isInteger(v) && v >= 0)
  );
}
