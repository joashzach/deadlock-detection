import { useEffect } from 'react';
import { useLabStore } from '../store/useLabStore';

const BASE_INTERVAL_MS = 700;

/**
 * Drives both playback modes from a single Play/Pause toggle:
 *  - graph mode advances the replayed trace one step at a time;
 *  - simulate mode ticks both simulator runs forward.
 *
 * Mounted once (in the Lab page) so playback keeps running while the user switches
 * between the two centre-panel workspaces.
 */
export function usePlaybackLoop() {
  const isPlaying = useLabStore((s) => s.isPlaying);
  const speed = useLabStore((s) => s.speed);
  const setPlaying = useLabStore((s) => s.setPlaying);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = Math.max(80, Math.round(BASE_INTERVAL_MS / speed));

    const id = setInterval(() => {
      const state = useLabStore.getState();

      if (state.labMode === 'simulate') {
        const sim = state.simulator;
        if (sim && sim.baseline.isFinished && sim.policied.isFinished) {
          setPlaying(false);
          return;
        }
        state.stepSimulator();
        return;
      }

      if (state.traceSteps.length === 0) {
        setPlaying(false);
        return;
      }
      if (state.stepIndex >= state.traceSteps.length - 1) {
        setPlaying(false);
        return;
      }
      state.nextStep();
    }, interval);

    return () => clearInterval(id);
  }, [isPlaying, speed, setPlaying]);
}
