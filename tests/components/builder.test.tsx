import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { Sidebar } from '../../src/components/Sidebar';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

describe('Scenario builder (component)', () => {
  beforeEach(() => {
    resetStore();
    cleanup();
  });

  it('adds and removes processes, removing their edges with them', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Add process'));
    fireEvent.click(screen.getByLabelText('Add process'));
    expect(useLabStore.getState().scenario.processes.map((p) => p.id)).toEqual(['P0', 'P1']);

    // Give P0 a resource so we can prove edges are removed with the node.
    fireEvent.click(screen.getByLabelText('Add resource'));
    let added: { ok: boolean } = { ok: false };
    act(() => {
      added = useLabStore.getState().addAssignmentEdge('R0', 'P0', 1);
    });
    expect(added.ok).toBe(true);
    expect(useLabStore.getState().scenario.edges).toHaveLength(1);

    fireEvent.click(screen.getByLabelText('Remove P0'));
    expect(useLabStore.getState().scenario.processes.map((p) => p.id)).toEqual(['P1']);
    expect(useLabStore.getState().scenario.edges).toHaveLength(0);
  });

  it('rejects assigning more instances than a resource has free and shows the reason', () => {
    resetStore();
    const store = useLabStore.getState();
    store.addProcess();
    store.addResource();

    const first = useLabStore.getState().addAssignmentEdge('R0', 'P0', 1);
    expect(first.ok).toBe(true);

    const second = useLabStore.getState().addAssignmentEdge('R0', 'P0', 1);
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/free/i);
    // Total allocation never exceeds capacity.
    expect(useLabStore.getState().scenario.edges.reduce((s, e) => s + e.count, 0)).toBe(1);
  });

  it('rejects demands that exceed declared Max', () => {
    resetStore('bankers-safe');
    // P1 already holds [2,0,0] and its Max on R0 is 3, so requesting 2 more of R0 exceeds Max.
    const result = useLabStore.getState().addRequestEdge('P1', 'R0', 2);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Max/i);
  });

  it('loads a preset from the dropdown', () => {
    resetStore();
    render(<Sidebar />);
    fireEvent.change(screen.getByLabelText('Preset'), { target: { value: 'dining-philosophers' } });
    expect(useLabStore.getState().scenarioId).toBe('dining-philosophers');
    expect(useLabStore.getState().scenario.processes).toHaveLength(5);
    expect(useLabStore.getState().scenario.resources).toHaveLength(5);
  });

  it('supports undo and redo of builder edits', () => {
    resetStore();
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Add process'));
    expect(useLabStore.getState().scenario.processes).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(useLabStore.getState().scenario.processes).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(useLabStore.getState().scenario.processes).toHaveLength(1);
  });
});
