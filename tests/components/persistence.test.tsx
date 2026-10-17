import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  attachPersistence,
  clearPersisted,
  hydrateFromStorage,
  loadPersisted,
} from '../../src/lib/persistence';
import { useLabStore } from '../../src/store/useLabStore';
import { PRESETS } from '../../src/scenarios/presets';
import { resetStore } from '../helpers/resetStore';
import { installFailingStorage, installMemoryStorage, removeStorage } from '../helpers/storage';

describe('Workspace persistence', () => {
  beforeEach(() => {
    installMemoryStorage();
    resetStore('classic-deadlock');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('saves the workspace on change and restores it into the store', () => {
    vi.useFakeTimers();
    const detach = attachPersistence();
    try {
      useLabStore.getState().loadPreset('bankers-safe');
      vi.advanceTimersByTime(400);

      expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
      const saved = loadPersisted();
      expect(saved).not.toBeNull();
      expect(saved!.scenario.processes).toHaveLength(5);
      expect(saved!.scenario.resources).toHaveLength(3);
      expect(saved!.name).toMatch(/banker/i);

      // Move the store elsewhere, then restore the saved workspace.
      useLabStore.getState().loadPreset('classic-deadlock');
      expect(useLabStore.getState().scenario.processes).toHaveLength(2);

      expect(hydrateFromStorage()).toBe(true);
      expect(useLabStore.getState().scenario.processes).toHaveLength(5);
      expect(useLabStore.getState().scenarioId).toBe('custom');
      expect(useLabStore.getState().traceSteps).toEqual([]);
    } finally {
      detach();
    }
  });

  it('round-trips policies, algorithm choice, mode, and scripts', () => {
    vi.useFakeTimers();
    const detach = attachPersistence();
    try {
      useLabStore.getState().setPolicies({ breakCircularWait: true });
      useLabStore.getState().setAlgorithm('multi-instance-matrix');
      useLabStore.getState().setLabMode('simulate');
      vi.advanceTimersByTime(400);

      const saved = loadPersisted()!;
      expect(saved.policies).toEqual({
        breakHoldAndWait: false,
        breakNoPreemption: false,
        breakCircularWait: true,
      });
      expect(saved.algorithm).toBe('multi-instance-matrix');
      expect(saved.labMode).toBe('simulate');
      expect(saved.scripts.length).toBe(useLabStore.getState().scenario.processes.length);

      hydrateFromStorage();
      expect(useLabStore.getState().policies.breakCircularWait).toBe(true);
      expect(useLabStore.getState().algorithm).toBe('multi-instance-matrix');
      expect(useLabStore.getState().labMode).toBe('simulate');
    } finally {
      detach();
    }
  });

  it('discards corrupt, version-mismatched, and invalid entries instead of trusting them', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ not json at all');
    expect(loadPersisted()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION + 1, name: 'Future', scenario: PRESETS['classic-deadlock']!.state })
    );
    expect(loadPersisted()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        name: 'Broken',
        scenario: {
          processes: [{ id: 'P0', name: 'P0' }],
          resources: [{ id: 'R0', name: 'R0', totalInstances: 0 }],
          edges: [],
        },
      })
    );
    expect(loadPersisted()).toBeNull();
    expect(hydrateFromStorage()).toBe(false);
    expect(useLabStore.getState().scenarioId).toBe('classic-deadlock');
  });

  it('repairs untrusted flags and never keeps an instruction for a missing resource', () => {
    const scenario = PRESETS['classic-deadlock']!.state;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        name: 'Saved',
        scenario,
        scripts: [
          {
            processId: 'P1',
            instructions: [
              { type: 'request', resourceId: 'R2', count: 1 },
              { type: 'request', resourceId: 'R_NOT_REAL', count: 4 },
              { type: 'nonsense' },
              { type: 'compute', duration: 0 },
            ],
          },
        ],
        policies: { breakHoldAndWait: true, breakCircularWait: 'yes please' },
        seed: 'not a number',
        algorithm: 'bogus',
        labMode: 'not-a-mode',
      })
    );

    const saved = loadPersisted()!;
    expect(saved.policies).toEqual({
      breakHoldAndWait: true,
      breakNoPreemption: false,
      breakCircularWait: false,
    });
    expect(saved.seed).toBe(1);
    expect(saved.algorithm).toBe('auto');
    expect(saved.labMode).toBe('graph');

    // The stored script list did not cover every process, so defaults were regenerated.
    expect(saved.scripts.length).toBe(scenario.processes.length);
    const resourceIds = new Set(scenario.resources.map((r) => r.id));
    const processIds = new Set(scenario.processes.map((p) => p.id));
    for (const script of saved.scripts) {
      expect(processIds.has(script.processId)).toBe(true);
      for (const instruction of script.instructions) {
        if (instruction.type !== 'compute') {
          expect(resourceIds.has(instruction.resourceId)).toBe(true);
        }
      }
    }
  });

  it('keeps a stored script that is still valid', () => {
    const scenario = PRESETS['classic-deadlock']!.state;
    const scripts = scenario.processes.map((p) => ({
      processId: p.id,
      instructions: [{ type: 'compute' as const, duration: 2 }],
    }));
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, name: 'Saved', scenario, scripts })
    );

    const saved = loadPersisted()!;
    expect(saved.scripts).toEqual(scripts);
  });

  it('does nothing when localStorage is missing entirely', () => {
    removeStorage();
    expect(loadPersisted()).toBeNull();
    expect(hydrateFromStorage()).toBe(false);

    vi.useFakeTimers();
    const detach = attachPersistence();
    useLabStore.getState().loadPreset('safe-chain');
    expect(() => vi.advanceTimersByTime(400)).not.toThrow();
    detach();
  });

  it('survives storage being blocked or full', () => {
    installFailingStorage();
    expect(loadPersisted()).toBeNull();
    expect(hydrateFromStorage()).toBe(false);

    vi.useFakeTimers();
    const detach = attachPersistence();
    try {
      useLabStore.getState().loadPreset('safe-chain');
      expect(() => vi.advanceTimersByTime(400)).not.toThrow();
    } finally {
      detach();
      clearPersisted();
    }
  });
});
