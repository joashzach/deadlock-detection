import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { BankersPanel } from '../../src/components/BankersPanel';
import { RecoveryPanel } from '../../src/components/RecoveryPanel';
import { RightPanel } from '../../src/components/RightPanel';
import { StatusBanner } from '../../src/components/StatusBanner';
import { PlaybackBar } from '../../src/components/PlaybackBar';
import { useLabStore } from '../../src/store/useLabStore';
import { deriveMatricesFromRAG } from '../../src/engine/rag';
import { resetStore } from '../helpers/resetStore';

describe("Banker's algorithm in the UI", () => {
  beforeEach(() => {
    cleanup();
  });

  it('runs the safety algorithm and exposes the safe sequence', () => {
    resetStore('bankers-safe');
    act(() => {
      useLabStore.getState().runSafety();
    });
    const state = useLabStore.getState();
    expect(state.traceKind).toBe('banker-safety');
    expect(state.safetyResult?.isSafe).toBe(true);
    expect(state.safetyResult?.safeSequence?.length).toBe(5);
    expect(state.traceSteps.length).toBeGreaterThan(0);
    expect(state.traceSteps[state.traceSteps.length - 1]!.title).toMatch(/SAFE State/i);

    render(<BankersPanel />);
    expect(screen.getByTestId('safety-result')).toHaveTextContent('Safe state');
    expect(screen.getByTestId('safety-result')).toHaveTextContent('P3');
  });

  it('reports a safe state as unsafe when no safe sequence exists', () => {
    resetStore('multi-deadlock');
    act(() => {
      useLabStore.getState().runSafety();
    });
    const state = useLabStore.getState();
    expect(state.safetyResult?.isSafe).toBe(false);
    render(<BankersPanel />);
    expect(screen.getByTestId('safety-result')).toHaveTextContent('Unsafe state');
  });

  it('grants a request that leaves the state safe and applies the allocation', () => {
    resetStore('bankers-safe');
    const before = deriveMatricesFromRAG(useLabStore.getState().scenario).allocation[1]![0]!;

    act(() => {
      useLabStore.getState().submitBankersRequest('P1', [1, 0, 0]);
    });

    const state = useLabStore.getState();
    expect(state.requestResult?.outcome).toBe('GRANTED');
    const after = deriveMatricesFromRAG(state.scenario).allocation[1]![0]!;
    expect(after).toBe(before + 1);

    render(<BankersPanel />);
    expect(screen.getByTestId('request-result')).toHaveTextContent('Granted (safe)');
  });

  it('denies a request that would leave the state unsafe, leaving the scenario unchanged', () => {
    resetStore('bankers-safe');
    const before = JSON.stringify(useLabStore.getState().scenario);

    // P4 asking for (3,3,0) leaves Available = (0,0,2) with no process able to finish → unsafe.
    act(() => {
      useLabStore.getState().submitBankersRequest('P4', [3, 3, 0]);
    });

    const state = useLabStore.getState();
    expect(state.requestResult?.outcome).toBe('DENIED_UNSAFE');
    expect(JSON.stringify(state.scenario)).toBe(before);

    render(<BankersPanel />);
    expect(screen.getByTestId('request-result')).toHaveTextContent('Denied (unsafe)');
  });

  it('reports must-wait when not enough instances are available', () => {
    resetStore('multi-safe');
    act(() => {
      useLabStore.getState().submitBankersRequest('P1', [1, 0, 0]);
    });
    expect(useLabStore.getState().requestResult?.outcome).toBe('WAIT_UNAVAILABLE');

    render(<BankersPanel />);
    expect(screen.getByTestId('request-result')).toHaveTextContent('Must wait');
  });

  it('reports an error when the request exceeds the declared Need', () => {
    resetStore('bankers-safe');
    act(() => {
      useLabStore.getState().submitBankersRequest('P0', [8, 0, 0]);
    });
    expect(useLabStore.getState().requestResult?.outcome).toBe('ERROR_EXCEEDS_NEED');

    render(<BankersPanel />);
    expect(screen.getByTestId('request-result')).toHaveTextContent('exceeds declared Need');
  });
});

describe('Recovery in the UI', () => {
  beforeEach(() => {
    cleanup();
  });

  it('terminating a victim resolves the deadlock and re-detection confirms it', () => {
    resetStore('classic-deadlock');
    act(() => {
      useLabStore.getState().runDetection();
    });
    expect(useLabStore.getState().detection?.hasDeadlock).toBe(true);

    act(() => {
      useLabStore.getState().applyRecovery('TERMINATE_VICTIM', { victimProcessId: 'P1' });
    });

    const state = useLabStore.getState();
    expect(state.recoveryResult?.resolved).toBe(true);
    expect(state.detection?.hasDeadlock).toBe(false);
    expect(state.traceKind).toBe('recovery');
    expect(state.scenario.processes.map((p) => p.id)).toEqual(['P2']);

    render(<StatusBanner />);
    expect(screen.getByTestId('banner-recovery')).toHaveTextContent('Recovery resolved');
  });

  it('shows the recovery controls only once a deadlock is known', () => {
    resetStore('safe-chain');
    render(<RecoveryPanel />);
    // Before any detection the panel only offers to run detection.
    expect(screen.getByText(/Run detection first/i)).toBeInTheDocument();
    expect(screen.queryByTestId('run-recovery')).not.toBeInTheDocument();

    act(() => {
      useLabStore.getState().runDetection();
    });
    expect(screen.getByTestId('recovery-nothing')).toHaveTextContent('No deadlock');
    expect(screen.queryByTestId('run-recovery')).not.toBeInTheDocument();
  });

  it('offers every strategy for a genuinely deadlocked system', () => {
    resetStore('classic-deadlock');
    act(() => {
      useLabStore.getState().runDetection();
    });
    render(<RecoveryPanel />);
    expect(screen.getByTestId('recovery-TERMINATE_ALL')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-TERMINATE_VICTIM')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-PREEMPT_RESOURCE')).toBeInTheDocument();
    expect(screen.getByTestId('run-recovery')).toBeEnabled();
  });

  it('terminate-all clears the whole deadlocked set', () => {
    resetStore('circular-wait-3');
    act(() => {
      useLabStore.getState().runDetection();
      useLabStore.getState().applyRecovery('TERMINATE_ALL');
    });
    const state = useLabStore.getState();
    expect(state.scenario.processes).toHaveLength(0);
    expect(state.recoveryResult?.resolved).toBe(true);
  });
});

describe('Trace playback', () => {
  beforeEach(() => {
    cleanup();
  });

  it('steps the explanation and highlights pseudocode for the current step', () => {
    resetStore('classic-deadlock');
    act(() => {
      useLabStore.getState().runDetection();
    });

    const container = render(<RightPanel />).container;
    const firstTitle = screen.getByTestId('explanation-title').textContent;

    act(() => {
      useLabStore.getState().nextStep();
    });
    expect(screen.getByTestId('explanation-title').textContent).not.toBe(firstTitle);

    act(() => {
      screen.getByRole('tab', { name: 'Pseudocode' }).click();
    });
    expect(container.querySelector('[data-active="true"]')).not.toBeNull();
  });

  it('advances with play, stops at the end, and clamps stepping at the boundaries', () => {
    resetStore('classic-deadlock');
    act(() => {
      useLabStore.getState().runDetection();
    });

    render(<PlaybackBar />);
    const total = useLabStore.getState().traceSteps.length;
    expect(screen.getByTestId('step-counter')).toHaveTextContent(`1 / ${total}`);

    act(() => {
      screen.getByTestId('play-toggle').click();
    });
    expect(useLabStore.getState().isPlaying).toBe(true);

    act(() => {
      useLabStore.getState().setStepIndex(total - 1);
      useLabStore.getState().nextStep();
    });
    expect(useLabStore.getState().stepIndex).toBe(total - 1);

    act(() => {
      useLabStore.getState().setStepIndex(0);
      useLabStore.getState().prevStep();
    });
    expect(useLabStore.getState().stepIndex).toBe(0);
  });
});
