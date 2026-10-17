import { useLabStore, DEFAULT_POLICIES } from '../../src/store/useLabStore';
import { PRESETS } from '../../src/scenarios/presets';
import { scriptsForPreset } from '../../src/scenarios/scripts';
import { autoLayout } from '../../src/lib/layout';
import { SystemState } from '../../src/engine/types';

/**
 * Restores the singleton store to a clean, deterministic state between tests.
 * Passing a preset id loads that preset (and its simulator script); otherwise the
 * store starts empty.
 */
export function resetStore(presetId?: string): void {
  const preset = presetId ? PRESETS[presetId] : undefined;
  const scenario: SystemState = preset
    ? {
        processes: preset.state.processes.map((p) => ({ ...p })),
        resources: preset.state.resources.map((r) => ({ ...r })),
        edges: preset.state.edges.map((e) => ({ ...e })),
        ...(preset.state.max ? { max: preset.state.max.map((r) => [...r]) } : {}),
      }
    : { processes: [], resources: [], edges: [] };

  useLabStore.setState({
    scenarioName: preset?.name ?? 'Untitled scenario',
    scenarioId: presetId ?? 'custom',
    scenario,
    positions: autoLayout(scenario),
    selectedNodeId: null,
    algorithm: 'auto',
    labMode: 'graph',
    detection: null,
    traceSteps: [],
    stepIndex: 0,
    isPlaying: false,
    speed: 1,
    traceKind: 'detection',
    safetyResult: null,
    requestResult: null,
    recoveryResult: null,
    policies: { ...DEFAULT_POLICIES },
    scripts: preset ? scriptsForPreset(presetId!, preset.state) : [],
    seed: 1,
    simulator: null,
    error: null,
    notice: null,
    past: [],
    future: [],
  });
}
