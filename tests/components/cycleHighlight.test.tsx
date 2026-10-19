import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { GraphCanvas } from '../../src/components/GraphCanvas';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';
import { computeCycleLength } from '../../src/lib/cycleEdges';

describe('Cycle Highlight (component)', () => {
  beforeEach(() => {
    cleanup();
  });
  afterEach(() => {
    cleanup();
  });

  it('highlights all cycle edges and cycle nodes with danger styling when classic deadlock is detected', () => {
    resetStore('classic-deadlock');
    act(() => {
      useLabStore.getState().runDetection();
    });

    render(<GraphCanvas />);

    const result = useLabStore.getState().detection;
    expect(result).not.toBeNull();
    expect(result?.deadlockedProcessIds.length).toBeGreaterThan(0);

    const scenario = useLabStore.getState().scenario;
    const cycleLength = computeCycleLength(scenario, result);
    expect(cycleLength).toBe(4); // 2 request + 2 assignment edges

    const cycleEdges = screen.getAllByTestId('cycle-edge');
    expect(cycleEdges.length).toBe(cycleLength);

    // Each cycle edge has deadlock-pulse class and danger line stroke
    for (const edge of cycleEdges) {
      expect(edge).toHaveClass('deadlock-pulse');
      const line = edge.querySelector('line');
      expect(line).toHaveAttribute('stroke', 'var(--color-ember)');
    }

    // All cycle processes and resources have danger styling and pulse
    const cycleProcesses = screen.getAllByTestId('cycle-process-node');
    expect(cycleProcesses.length).toBe(2);
    for (const node of cycleProcesses) {
      expect(node).toHaveClass('deadlock-pulse');
    }

    const cycleResources = screen.getAllByTestId('cycle-resource-node');
    expect(cycleResources.length).toBe(2);
    for (const node of cycleResources) {
      expect(node).toHaveClass('deadlock-pulse');
    }
  });

  it('asserts highlighted edge count equals cycle length for circular-wait-3', () => {
    resetStore('circular-wait-3');
    act(() => {
      useLabStore.getState().runDetection();
    });

    render(<GraphCanvas />);

    const result = useLabStore.getState().detection;
    expect(result).not.toBeNull();
    const scenario = useLabStore.getState().scenario;
    const cycleLength = computeCycleLength(scenario, result);
    expect(cycleLength).toBe(6); // 3 request + 3 assignment edges

    const cycleEdges = screen.getAllByTestId('cycle-edge');
    expect(cycleEdges.length).toBe(cycleLength);

    for (const edge of cycleEdges) {
      expect(edge).toHaveClass('deadlock-pulse');
    }

    const cycleProcesses = screen.getAllByTestId('cycle-process-node');
    expect(cycleProcesses.length).toBe(3);

    const cycleResources = screen.getAllByTestId('cycle-resource-node');
    expect(cycleResources.length).toBe(3);
  });
});

