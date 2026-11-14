import { useState, useRef, useEffect } from 'react';
import { useLabStore } from '../store/useLabStore';
import { Button } from './ui/Button';
import {
  StepFirstIcon,
  StepPrevIcon,
  PlayIcon,
  PauseIcon,
  StepNextIcon,
  StepLastIcon,
} from './ui/Icons';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function PlaybackBar() {
  const labMode = useLabStore((s) => s.labMode);
  const traceSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const isPlaying = useLabStore((s) => s.isPlaying);
  const speed = useLabStore((s) => s.speed);
  const setStepIndex = useLabStore((s) => s.setStepIndex);
  const nextStep = useLabStore((s) => s.nextStep);
  const prevStep = useLabStore((s) => s.prevStep);
  const togglePlaying = useLabStore((s) => s.togglePlaying);
  const setSpeed = useLabStore((s) => s.setSpeed);
  const clearTrace = useLabStore((s) => s.clearTrace);
  const runDetection = useLabStore((s) => s.runDetection);

  // Undo / Redo
  const undo = useLabStore((s) => s.undo);
  const redo = useLabStore((s) => s.redo);
  const pastLength = useLabStore((s) => s.past.length);
  const futureLength = useLabStore((s) => s.future.length);

  // Simulator
  const simulator = useLabStore((s) => s.simulator);
  const initSimulator = useLabStore((s) => s.initSimulator);
  const resetSimulator = useLabStore((s) => s.resetSimulator);
  const stepSimulator = useLabStore((s) => s.stepSimulator);
  const stepSimulatorCount = useLabStore((s) => s.stepSimulatorCount);

  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSim = labMode === 'simulate';
  const hasTrace = traceSteps.length > 0;
  const atEnd = hasTrace && stepIndex >= traceSteps.length - 1;
  const simFinished = simulator
    ? simulator.baseline.isFinished && simulator.policied.isFinished
    : false;

  const currentTick = simulator?.policied.tick ?? 0;

  const handlePlay = () => {
    if (isSim) {
      if (!simulator) {
        initSimulator();
      }
    } else if (!hasTrace) {
      runDetection();
    }
    togglePlaying();
  };

  const handleReset = () => {
    if (isSim) {
      resetSimulator();
    } else {
      clearTrace();
    }
  };

  const handleStep = () => {
    if (isSim) {
      if (!simulator) {
        initSimulator();
      } else {
        stepSimulator();
      }
    } else {
      nextStep();
    }
  };

  const handleRunToEnd = () => {
    if (isSim) {
      if (!simulator) {
        initSimulator();
      }
      stepSimulatorCount(400);
    } else if (hasTrace) {
      setStepIndex(traceSteps.length - 1);
    }
  };

  return (
    <div
      data-testid="playback-bar"
      className="bg-white border border-line flex items-center justify-between shrink-0 select-none z-10 w-full h-[48px] min-h-[48px] max-h-[48px] px-6 gap-3 overflow-x-auto no-scrollbar"
      role="toolbar"
      aria-label="Algorithm playback"
    >
      {/* Left controls: Execution & Playback */}
      <div className="flex items-center gap-3 shrink-0 flex-nowrap">
        {isSim ? (
          <>
            {/* Simulator toolbar: Play | Step | Run to end | Reset */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePlay}
              disabled={simFinished && !isPlaying}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              data-testid="sim-play"
              className="flex items-center justify-center gap-4 text-[12px] font-medium h-[32px] px-7"
            >
              {isPlaying ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleStep}
              disabled={simFinished}
              aria-label="Step"
              data-testid="sim-step"
              className="text-[12px] font-medium h-[32px] px-6"
            >
              Step
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunToEnd}
              disabled={simFinished}
              aria-label="Run to end"
              data-testid="sim-run-to-end"
              className="text-[12px] font-medium h-[32px] px-6"
            >
              Run to end
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              aria-label="Reset"
              data-testid="reset-simulator"
              className="text-[12px] font-medium h-[32px] px-6"
            >
              Reset
            </Button>
          </>
        ) : (
          <>
            {/* Graph toolbar: Detect | 5 playback buttons | Step counter | Clear */}
            <Button
              variant="secondary"
              size="sm"
              onClick={runDetection}
              aria-label="Detect deadlock"
              data-testid="detect-button"
              className="flex items-center justify-center text-[12px] font-medium h-[32px] px-7"
            >
              Detect
            </Button>

            <div className="flex items-center gap-[2px]">
              <Button
                variant="secondary"
                size="icon-sm"
                className="h-[32px] w-[26px]"
                disabled={!hasTrace || stepIndex <= 0}
                onClick={() => setStepIndex(0)}
                aria-label="First step"
                title="First step"
              >
                <StepFirstIcon size={12} />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="h-[32px] w-[26px]"
                disabled={!hasTrace || stepIndex <= 0}
                onClick={prevStep}
                aria-label="Previous step"
                title="Previous step"
              >
                <StepPrevIcon size={12} />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="h-[32px] w-[26px]"
                disabled={!hasTrace}
                onClick={handlePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
                data-testid="play-toggle"
              >
                {isPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="h-[32px] w-[26px]"
                disabled={!hasTrace || atEnd}
                onClick={handleStep}
                aria-label="Next step"
                title="Next step"
                data-testid="step-button"
              >
                <StepNextIcon size={12} />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                className="h-[32px] w-[26px]"
                disabled={!hasTrace || atEnd}
                onClick={() => setStepIndex(traceSteps.length - 1)}
                aria-label="Last step"
                title="Last step"
                data-testid="run-to-end"
              >
                <StepLastIcon size={12} />
              </Button>
            </div>

            <span
              className="font-mono text-[11px] text-muted tabular-nums px-2 flex items-center justify-center h-[32px] shrink-0"
              data-testid="step-counter"
            >
              {hasTrace ? `Step ${stepIndex + 1} / ${traceSteps.length}` : '– / –'}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={clearTrace}
              disabled={!hasTrace}
              aria-label="Clear trace"
              className="text-[12px] font-medium h-[32px] px-6"
            >
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Right controls: Divider | Undo | Redo | Speed/Tick */}
      <div className="flex items-center gap-2 shrink-0 flex-nowrap">
        <div className="h-[20px] w-[1px] bg-line/80 mx-1 shrink-0" aria-hidden="true" />

        <Button
          variant="secondary"
          size="sm"
          onClick={undo}
          disabled={pastLength === 0}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          className="text-[12px] font-medium h-[32px] px-5"
        >
          Undo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={redo}
          disabled={futureLength === 0}
          aria-label="Redo"
          title="Redo (Ctrl+Y)"
          className="text-[12px] font-medium h-[32px] px-5"
        >
          Redo
        </Button>

        {/* Readout: tick X · 1x in Simulator, 1x in Graph */}
        <div ref={speedRef} className="relative inline-flex items-center shrink-0">
          <button
            type="button"
            className="h-[32px] px-3 inline-flex items-center justify-center font-mono text-[11px] text-muted hover:text-ink cursor-pointer transition-colors whitespace-nowrap border border-line bg-white hover:bg-tint-bg rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy shrink-0"
            onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
            aria-label={
              isSim
                ? `Playback speed and tick, currently tick ${currentTick}, speed ${speed}x`
                : `Playback speed, currently ${speed}x`
            }
            data-testid={isSim ? 'sim-tick' : undefined}
          >
            {isSim ? `tick ${currentTick} · ${speed}×` : `${speed}×`}
          </button>

          {/* Speed select menu */}
          {speedMenuOpen && (
            <div className="absolute right-0 top-full mt-4 bg-white border border-line py-4 z-50 shadow-none min-w-[90px]">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`w-full text-left px-12 py-6 font-mono text-[12px] hover:bg-tint-bg cursor-pointer ${
                    s === speed ? 'text-navy font-semibold bg-tint-bg' : 'text-ink'
                  }`}
                  onClick={() => {
                    setSpeed(s);
                    setSpeedMenuOpen(false);
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>
          )}

          {/* Hidden select for test automation compatibility */}
          <select
            className="sr-only"
            aria-label="Playback speed"
            data-testid="speed-select"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
