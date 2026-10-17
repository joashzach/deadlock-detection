import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { parseScenarioJson } from '../../src/lib/schema';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

function Boom(): JSX.Element {
  throw new Error('forced failure');
}

describe('Error boundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    cleanup();
  });

  it('renders the fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/Something went wrong/i);
    expect(screen.getByText(/forced failure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload the app/i })).toBeInTheDocument();
  });
});

describe('JSON import validation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('rejects malformed JSON with a readable error', () => {
    const result = parseScenarioJson('{ not really json');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Not valid JSON/i);
  });

  it('rejects a structurally invalid scenario', () => {
    const result = parseScenarioJson(JSON.stringify({ processes: 'nope', resources: [], edges: [] }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid scenario/i);
  });

  it('accepts a well-formed scenario', () => {
    const result = parseScenarioJson(
      JSON.stringify({
        schemaVersion: 1,
        name: 'Imported',
        scenario: {
          processes: [{ id: 'P0', name: 'P0' }],
          resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
          edges: [],
        },
      })
    );
    expect(result.ok).toBe(true);
    expect(result.name).toBe('Imported');
    expect(result.scenario?.processes).toHaveLength(1);
  });

  it('refuses to load a scenario that breaks engine invariants', () => {
    const bad = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'R0', totalInstances: 1 }],
      edges: [{ id: 'e1', type: 'assignment' as const, from: 'R0', to: 'P0', count: 2 }],
    };
    const applied = useLabStore.getState().importScenario('Bad', bad);
    expect(applied.ok).toBe(false);
    expect(applied.error).toMatch(/exceed/i);
    // State is untouched.
    expect(useLabStore.getState().scenario.processes).toHaveLength(0);
  });
});
