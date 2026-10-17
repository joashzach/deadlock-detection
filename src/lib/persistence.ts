/**
 * Workspace persistence (PRD §2).
 *
 * The app is fully client-side, so a reload should not throw away the scenario the
 * student was building. Everything written here is validated on the way back in:
 * a stale, truncated, or hand-edited entry is discarded rather than trusted, and
 * storage failures (private mode, quota, disabled storage) are swallowed so the app
 * still runs.
 */
import { PreventionPolicies, ProcessScript, SimulatorScriptCommand, SystemState } from '../engine/types';
import { AlgorithmChoice, LabMode, useLabStore } from '../store/useLabStore';
import { autoLayout } from './layout';
import { defaultScripts } from '../scenarios/scripts';
import { parseScenarioJson } from './schema';

export const STORAGE_KEY = 'deadlocklab:workspace';
export const STORAGE_VERSION = 1;

const ALGORITHMS: AlgorithmChoice[] = ['auto', 'single-instance-wfg', 'multi-instance-matrix'];
const MODES: LabMode[] = ['graph', 'simulate'];

interface PersistedWorkspace {
  version: number;
  name: string;
  scenario: SystemState;
  scripts: ProcessScript[];
  policies: PreventionPolicies;
  seed: number;
  algorithm: AlgorithmChoice;
  labMode: LabMode;
}

/**
 * Resolves the browser storage, or null when it is absent or blocked. Every caller
 * treats null as "do not persist" rather than failing.
 */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** True when `value` is a well-formed simulator instruction. */
function isInstruction(value: unknown): value is SimulatorScriptCommand {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.type === 'compute') {
    return typeof record.duration === 'number' && Number.isFinite(record.duration) && record.duration >= 1;
  }
  if (record.type === 'request' || record.type === 'release') {
    return (
      typeof record.resourceId === 'string' &&
      typeof record.count === 'number' &&
      Number.isFinite(record.count) &&
      record.count >= 1
    );
  }
  return false;
}

/**
 * Keeps only the scripts that still make sense for this scenario. Anything unusable
 * falls back to freshly generated default scripts, so the simulator always has a
 * coherent program to run.
 */
function sanitizeScripts(value: unknown, scenario: SystemState): ProcessScript[] {
  const fallback = defaultScripts(scenario);
  if (!Array.isArray(value)) return fallback;

  const processIds = new Set(scenario.processes.map((p) => p.id));
  const resourceIds = new Set(scenario.resources.map((r) => r.id));

  const scripts: ProcessScript[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.processId !== 'string' || !processIds.has(record.processId)) continue;

    const instructions = (Array.isArray(record.instructions) ? record.instructions : [])
      .filter(isInstruction)
      .filter((i) => i.type === 'compute' || resourceIds.has(i.resourceId));

    scripts.push({ processId: record.processId, instructions });
  }

  const coversEveryProcess = scripts.length === scenario.processes.length;
  return coversEveryProcess ? scripts : fallback;
}

/** Reads and validates the saved workspace, or returns null when there is nothing usable. */
export function loadPersisted(): PersistedWorkspace | null {
  const storage = getStorage();
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Record<string, unknown>;
    if (candidate.version !== STORAGE_VERSION) return null;

    // Reuse the export schema so a corrupted scenario can never reach the engine.
    const validated = parseScenarioJson(
      JSON.stringify({
        schemaVersion: STORAGE_VERSION,
        name: typeof candidate.name === 'string' ? candidate.name : 'Restored scenario',
        scenario: candidate.scenario,
      })
    );
    if (!validated.ok || !validated.scenario) return null;

    const scenario: SystemState = {
      ...validated.scenario,
      ...(validated.scenario.max ? { max: validated.scenario.max.map((row) => [...row]) } : {}),
    };

    const policies = candidate.policies as Partial<PreventionPolicies> | undefined;
    const seed = typeof candidate.seed === 'number' && Number.isFinite(candidate.seed) ? candidate.seed : 1;
    const algorithm = ALGORITHMS.includes(candidate.algorithm as AlgorithmChoice)
      ? (candidate.algorithm as AlgorithmChoice)
      : 'auto';
    const labMode = MODES.includes(candidate.labMode as LabMode) ? (candidate.labMode as LabMode) : 'graph';

    return {
      version: STORAGE_VERSION,
      name: typeof candidate.name === 'string' && candidate.name ? candidate.name : 'Restored scenario',
      scenario,
      scripts: sanitizeScripts(candidate.scripts, scenario),
      policies: {
        breakHoldAndWait: policies?.breakHoldAndWait === true,
        breakNoPreemption: policies?.breakNoPreemption === true,
        breakCircularWait: policies?.breakCircularWait === true,
      },
      seed,
      algorithm,
      labMode,
    };
  } catch {
    return null;
  }
}

/**
 * Restores the saved workspace into the store. Called once before the first render;
 * a no-op when nothing valid is stored.
 */
export function hydrateFromStorage(): boolean {
  const saved = loadPersisted();
  if (!saved) return false;

  useLabStore.setState({
    scenarioName: saved.name,
    scenarioId: 'custom',
    scenario: saved.scenario,
    positions: autoLayout(saved.scenario),
    selectedNodeId: null,
    algorithm: saved.algorithm,
    labMode: saved.labMode,
    policies: saved.policies,
    scripts: saved.scripts,
    seed: saved.seed,
    detection: null,
    traceSteps: [],
    stepIndex: 0,
    isPlaying: false,
    safetyResult: null,
    requestResult: null,
    recoveryResult: null,
    simulator: null,
    error: null,
    notice: null,
    past: [],
    future: [],
  });
  return true;
}

/**
 * Persists the workspace after every change (debounced), and returns a detach function.
 */
export function attachPersistence(): () => void {
  const storage = getStorage();
  if (!storage) return () => undefined;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = () => {
    const state = useLabStore.getState();
    const payload: PersistedWorkspace = {
      version: STORAGE_VERSION,
      name: state.scenarioName,
      scenario: state.scenario,
      scripts: state.scripts,
      policies: state.policies,
      seed: state.seed,
      algorithm: state.algorithm,
      labMode: state.labMode,
    };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage unavailable or full — persistence is a convenience, never a requirement.
    }
  };

  const unsubscribe = useLabStore.subscribe(() => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(write, 250);
  });

  return () => {
    if (timer !== null) clearTimeout(timer);
    unsubscribe();
  };
}

/** Removes the saved workspace (used by tests and a fresh-start path). */
export function clearPersisted(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
