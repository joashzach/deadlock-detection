import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { PreventionPanel } from '../../src/components/PreventionPanel';
import { SimulatorView } from '../../src/components/SimulatorView';
import { PolicyToast } from '../../src/components/PolicyToast';
import { Lab } from '../../src/pages/Lab';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

describe('Prevention policies', () => {
  beforeEach(() => cleanup());

  it('renders each Coffman-breaking toggle plus the read-only mutual-exclusion card', () => {
    resetStore('dining-philosophers');
    render(<PreventionPanel />);

    expect(screen.getByTestId('policy-breakHoldAndWait')).not.toBeChecked();
    expect(screen.getByTestId('policy-breakNoPreemption')).not.toBeChecked();
    expect(screen.getByTestId('policy-breakCircularWait')).not.toBeChecked();
    expect(screen.getByTestId('mutual-exclusion-card')).toHaveTextContent(/cannot be removed/i);

    fireEvent.click(screen.getByTestId('policy-breakCircularWait'));
    expect(useLabStore.getState().policies.breakCircularWait).toBe(true);
  });
});

describe('Live simulator', () => {
  beforeEach(() => cleanup());

  it('deadlocks without a policy and completes with circular-wait prevention enabled', () => {
    resetStore('dining-philosophers');

    act(() => {
      useLabStore.getState().initSimulator();
      useLabStore.getState().stepSimulatorCount(120);
    });

    const withoutPolicies = useLabStore.getState().simulator!;
    expect(withoutPolicies.baseline.detectionResult?.hasDeadlock).toBe(true);
    expect(typeof withoutPolicies.baseline.deadlockDetectedAtTick).toBe('number');
    expect(withoutPolicies.policied.detectionResult?.hasDeadlock).toBe(true);

    act(() => {
      useLabStore.getState().setPolicies({ breakCircularWait: true });
      useLabStore.getState().initSimulator();
      useLabStore.getState().stepSimulatorCount(120);
    });

    const withPolicy = useLabStore.getState().simulator!;
    expect(withPolicy.policied.detectionResult?.hasDeadlock).toBe(false);
    expect(withPolicy.policied.processStatuses.every((p) => p.state === 'Finished')).toBe(true);
    // The baseline is unaffected by the toggle, so it still deadlocks.
    expect(withPolicy.baseline.detectionResult?.hasDeadlock).toBe(true);
  });

  it('records a policy notice naming the rule and Coffman condition, and toasts it', () => {
    resetStore('dining-philosophers');
    act(() => {
      useLabStore.getState().setPolicies({ breakCircularWait: true });
      useLabStore.getState().initSimulator();
      useLabStore.getState().stepSimulatorCount(4);
    });

    const events = useLabStore.getState().simulator!.policied.events;
    const rejection = events.find((e) => e.outcome === 'rejected_policy');
    expect(rejection).toBeDefined();
    expect(rejection?.policyNotice?.coffmanCondition).toBe('Circular Wait');
    expect(rejection?.policyNotice?.rule).toBeTruthy();

    render(
      <>
        <SimulatorView />
        <PolicyToast />
      </>
    );

    expect(screen.getByTestId('policy-toast')).toHaveTextContent('Circular Wait');
    expect(screen.getByTestId('run-baseline')).toBeInTheDocument();
    expect(screen.getByTestId('run-policied')).toBeInTheDocument();
    expect(screen.getByTestId('sim-comparison')).toHaveTextContent('Baseline deadlocked');
    expect(screen.getByTestId('run-policied-processes')).toHaveTextContent('P4');
  });

  it('steps the simulator from the viewer controls', () => {
    resetStore('classic-deadlock');
    render(<SimulatorView />);

    act(() => {
      fireEvent.click(screen.getByTestId('init-simulator'));
    });
    expect(screen.getByTestId('sim-tick')).toHaveTextContent('tick 0');

    act(() => {
      fireEvent.click(screen.getByTestId('sim-step'));
    });
    expect(screen.getByTestId('sim-tick')).toHaveTextContent('tick 1');
  });
});

describe('Workspace switch', () => {
  beforeEach(() => cleanup());

  it('switches between the graph and the simulator workspaces', () => {
    resetStore('classic-deadlock');
    render(<Lab />);

    expect(screen.getByTestId('detect-button')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('workspace-simulate'));
    });
    expect(screen.getByRole('heading', { name: 'Live simulator' })).toBeInTheDocument();
    expect(screen.getByTestId('init-simulator')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('workspace-graph'));
    });
    expect(screen.getByTestId('detect-button')).toBeInTheDocument();
  });
});
