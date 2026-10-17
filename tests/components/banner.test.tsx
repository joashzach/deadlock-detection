import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

const EXPECTATIONS: Array<{ preset: string; expectText: RegExp }> = [
  { preset: 'classic-deadlock', expectText: /Deadlock detected: P1, P2/ },
  { preset: 'safe-chain', expectText: /No deadlock/ },
  { preset: 'circular-wait-3', expectText: /Deadlock detected: P1, P2, P3/ },
  { preset: 'bankers-safe', expectText: /No deadlock/ },
  { preset: 'multi-safe', expectText: /No deadlock/ },
  { preset: 'multi-deadlock', expectText: /Deadlock detected: P1, P2, P3, P4/ },
  { preset: 'dining-philosophers', expectText: /Deadlock detected: P0, P1, P2, P3, P4/ },
];

describe('Detection banner per preset', () => {
  beforeEach(() => {
    cleanup();
  });

  for (const { preset, expectText } of EXPECTATIONS) {
    it(`reports the correct result for "${preset}"`, () => {
      resetStore(preset);
      useLabStore.getState().runDetection();
      render(<StatusBanner />);
      expect(screen.getByTestId('status-banner')).toHaveTextContent(expectText);
    });
  }

  it('shows the idle prompt before any detection runs', () => {
    resetStore('classic-deadlock');
    render(<StatusBanner />);
    expect(screen.getByText(/No detection has been run/i)).toBeInTheDocument();
  });

  it('warns when the WFG algorithm is forced onto a multi-instance scenario', () => {
    resetStore('multi-deadlock');
    useLabStore.getState().setAlgorithm('single-instance-wfg');
    useLabStore.getState().runDetection();
    expect(useLabStore.getState().notice).toMatch(/single-instance/i);
  });
});
