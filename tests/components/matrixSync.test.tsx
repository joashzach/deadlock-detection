import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MatrixEditor } from '../../src/components/MatrixEditor';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

describe('Matrix ↔ graph sync (component)', () => {
  beforeEach(() => {
    cleanup();
  });

  it('editing an Allocation cell updates the assignment edge', () => {
    resetStore('bankers-safe');
    render(<MatrixEditor />);

    const cell = screen.getByLabelText('Allocation P0 R1');
    fireEvent.change(cell, { target: { value: '2' } });

    const edge = useLabStore
      .getState()
      .scenario.edges.find((e) => e.type === 'assignment' && e.from === 'R1' && e.to === 'P0');
    expect(edge?.count).toBe(2);
  });

  it('editing an Allocation cell to zero removes the assignment edge', () => {
    resetStore('bankers-safe');
    render(<MatrixEditor />);

    fireEvent.change(screen.getByLabelText('Allocation P0 R1'), { target: { value: '0' } });

    const exists = useLabStore
      .getState()
      .scenario.edges.some((e) => e.type === 'assignment' && e.from === 'R1' && e.to === 'P0');
    expect(exists).toBe(false);
  });

  it('editing a Request cell creates a request edge', () => {
    resetStore('bankers-safe');
    render(<MatrixEditor />);

    fireEvent.change(screen.getByLabelText('Request P0 R0'), { target: { value: '1' } });

    const edge = useLabStore
      .getState()
      .scenario.edges.find((e) => e.type === 'request' && e.from === 'P0' && e.to === 'R0');
    expect(edge?.count).toBe(1);
  });

  it('editing Need sets Max = Allocation + Need', () => {
    resetStore('bankers-safe');
    render(<MatrixEditor />);

    // P0/R2: Allocation 0, Max 3 → set Need to 5 → Max becomes 5.
    fireEvent.change(screen.getByLabelText('Need P0 R2'), { target: { value: '5' } });

    const max = useLabStore.getState().scenario.max!;
    const p0 = useLabStore.getState().scenario.processes.findIndex((p) => p.id === 'P0');
    const r2 = useLabStore.getState().scenario.resources.findIndex((r) => r.id === 'R2');
    expect(max[p0]![r2]).toBe(5);
  });

  it('graph edits are reflected back in the matrix', () => {
    resetStore();
    const store = useLabStore.getState();
    store.addProcess();
    store.addResource();
    useLabStore.getState().addAssignmentEdge('R0', 'P0', 1);

    render(<MatrixEditor />);
    const cell = screen.getByLabelText('Allocation P0 R0') as HTMLInputElement;
    expect(cell.value).toBe('1');
  });

  it('rejects allocating beyond a resource’s capacity and keeps state unchanged', () => {
    resetStore();
    const store = useLabStore.getState();
    store.addProcess();
    store.addResource(); // R0 has 1 instance
    useLabStore.getState().addAssignmentEdge('R0', 'P0', 1);

    render(<MatrixEditor />);
    fireEvent.change(screen.getByLabelText('Allocation P0 R0'), { target: { value: '2' } });

    const total = useLabStore
      .getState()
      .scenario.edges.reduce((s, e) => s + e.count, 0);
    expect(total).toBe(1);
  });

  it('loads "Classic deadlock" and asserts Allocation shows P1→R1 = 1 and P2→R2 = 1', () => {
    resetStore('classic-deadlock');
    render(<MatrixEditor />);

    const p1r1 = screen.getByLabelText('Allocation P1 R1') as HTMLInputElement;
    const p1r2 = screen.getByLabelText('Allocation P1 R2') as HTMLInputElement;
    const p2r1 = screen.getByLabelText('Allocation P2 R1') as HTMLInputElement;
    const p2r2 = screen.getByLabelText('Allocation P2 R2') as HTMLInputElement;

    expect(p1r1.value).toBe('1');
    expect(p1r2.value).toBe('0');
    expect(p2r1.value).toBe('0');
    expect(p2r2.value).toBe('1');
  });
});
