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
  UndoIcon,
  RedoIcon,
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

  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1360
  );
  const [showSpeedReadout, setShowSpeedReadout] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1180
  );

  useEffect(() => {
    const handleResize = () => {
      setIsWide(window.innerWidth >= 1360);
      setShowSpeedReadout(window.innerWidth >= 1180);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      className="bg-white border border-line flex items-center justify-between shrink-0 select-none z-10 w-full overflow-hidden no-scrollbar h-[64px] min-h-[64px] max-h-[64px] px-[16px] md:px-[24px]"
      role="toolbar"
      aria-label="Algorithm playback"
    >
      {/* Left controls: gap 8, var(--ctrl-h) buttons */}
      <div className="flex items-center gap-[8px] shrink-0 flex-nowrap">
        {isSim ? (
          <>
            {/* Simulator toolbar: Play (PRIMARY) · Step · Run to end · Reset */}
            <Button
              variant="primary"
              onClick={handlePlay}
              disabled={simFinished && !isPlaying}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              data-testid="sim-play"
              className="flex items-center justify-center gap-[6px] min-w-[88px]"
            >
              {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleStep}
              disabled={simFinished}
              aria-label="Step"
              data-testid="sim-step"
            >
              Step
            </Button>

            <Button
              variant="secondary"
              onClick={handleRunToEnd}
              disabled={simFinished}
              aria-label="Run to end"
              data-testid="sim-run-to-end"
            >
              Run to end
            </Button>

            <Button
              variant="secondary"
              onClick={handleReset}
              aria-label="Reset"
              data-testid="reset-simulator"
            >
              Reset
            </Button>
          </>
        ) : (
          <>
            {/* Graph toolbar: Detect (PRIMARY) · first/previous/play/next/last stepper · Step readout · Clear */}
            <Button
              variant="primary"
              onClick={runDetection}
              aria-label="Detect deadlock"
              data-testid="detect-button"
              className="min-w-[88px] flex items-center justify-center"
            >
              Detect
            </Button>

            <div className="flex items-center gap-[4px]">
              <Button
                variant="secondary"
                size="icon"
                disabled={!hasTrace || stepIndex <= 0}
                onClick={() => setStepIndex(0)}
                aria-label="First step"
                title="First step"
              >
                <StepFirstIcon size={16} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={!hasTrace || stepIndex <= 0}
                onClick={prevStep}
                aria-label="Previous step"
                title="Previous step"
              >
                <StepPrevIcon size={16} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={!hasTrace}
                onClick={handlePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
                data-testid="play-toggle"
              >
                {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={!hasTrace || atEnd}
                onClick={handleStep}
                aria-label="Next step"
                title="Next step"
                data-testid="step-button"
              >
                <StepNextIcon size={16} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={!hasTrace || atEnd}
                onClick={() => setStepIndex(traceSteps.length - 1)}
                aria-label="Last step"
                title="Last step"
                data-testid="run-to-end"
              >
                <StepLastIcon size={16} />
              </Button>
            </div>

            <span
              className="font-mono text-[13px] text-ink tabular-nums px-[4px] flex items-center justify-center h-[var(--ctrl-h)] min-w-[104px]"
              data-testid="step-counter"
            >
              {hasTrace ? `Step ${stepIndex + 1} / ${traceSteps.length}` : '– / –'}
            </span>

            <Button
              variant="secondary"
              onClick={clearTrace}
              disabled={!hasTrace}
              aria-label="Clear trace"
            >
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Right controls: Undo, Redo, Readout "tick 0 · 1×" */}
      <div className="flex items-center gap-[8px] shrink-0 flex-nowrap">
        <Button
          variant="secondary"
          size={isWide ? 'default' : 'icon'}
          onClick={undo}
          disabled={pastLength === 0}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          {isWide ? 'Undo' : <UndoIcon size={14} />}
        </Button>
        <Button
          variant="secondary"
          size={isWide ? 'default' : 'icon'}
          onClick={redo}
          disabled={futureLength === 0}
          aria-label="Redo"
          title="Redo (Ctrl+Y)"
        >
          {isWide ? 'Redo' : <RedoIcon size={14} />}
        </Button>

        {/* Readout: tick 0 · 1× hidden below 1180px */}
        {showSpeedReadout && (
          <div ref={speedRef} className="relative inline-flex items-center">
            <button
              type="button"
              className="h-[var(--ctrl-h)] px-8 inline-flex items-center justify-center font-mono text-[12px] text-muted hover:text-ink cursor-pointer transition-colors whitespace-nowrap rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              aria-label={`Playback speed and tick, currently tick ${currentTick}, speed ${speed}x`}
              data-testid={isSim ? 'sim-tick' : undefined}
            >
              tick {currentTick} · {speed}×
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
        )}
      </div>
    </div>
  );
}
