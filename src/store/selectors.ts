import { useMemo } from 'react';
import { useLabStore } from './useLabStore';
import { SystemState } from '../engine/types';

/**
 * The scenario the canvas should draw.
 *
 * While a trace is loaded the canvas replays the trace's own snapshots, so a
 * Banker's trial allocation or a recovery action is visible at each step. With no
 * trace loaded the editable scenario is drawn instead.
 */
export function useDisplayedScenario(): SystemState {
  const scenario = useLabStore((s) => s.scenario);
  const traceSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);

  return useMemo(() => {
    if (traceSteps.length === 0) return scenario;
    const step = traceSteps[Math.min(stepIndex, traceSteps.length - 1)];
    return step ? step.snapshot : scenario;
  }, [scenario, traceSteps, stepIndex]);
}
