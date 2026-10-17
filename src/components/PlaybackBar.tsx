import { useLabStore } from '../store/useLabStore';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function PlaybackBar() {
  const traceSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const detection = useLabStore((s) => s.detection);
  const traceKind = useLabStore((s) => s.traceKind);
  const isPlaying = useLabStore((s) => s.isPlaying);
  const speed = useLabStore((s) => s.speed);
  const setStepIndex = useLabStore((s) => s.setStepIndex);
  const nextStep = useLabStore((s) => s.nextStep);
  const prevStep = useLabStore((s) => s.prevStep);
  const togglePlaying = useLabStore((s) => s.togglePlaying);
  const setSpeed = useLabStore((s) => s.setSpeed);
  const clearTrace = useLabStore((s) => s.clearTrace);
  const runDetection = useLabStore((s) => s.runDetection);
  const algorithm = useLabStore((s) => s.algorithm);
  const setAlgorithm = useLabStore((s) => s.setAlgorithm);

  const hasTrace = traceSteps.length > 0;
  const atEnd = hasTrace && stepIndex >= traceSteps.length - 1;

  const kindLabel =
    traceKind === 'detection'
      ? 'Detection'
      : traceKind === 'banker-safety'
        ? "Banker's safety"
        : traceKind === 'banker-request'
          ? "Banker's request"
          : traceKind === 'recovery'
            ? 'Recovery'
            : 'Simulation';

  return (
    <div
      className="absolute bottom-16 left-1/2 -translate-x-1/2 panel px-16 py-8 flex flex-wrap items-center justify-center gap-8 shadow-none max-w-[calc(100%-32px)]"
      role="group"
      aria-label="Algorithm playback"
    >
      <button type="button" className="btn btn-ember" onClick={runDetection} data-testid="detect-button">
        Detect deadlock
      </button>

      <span className="w-px h-[24px] bg-fog mx-4" aria-hidden="true" />

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => setStepIndex(0)}
        disabled={!hasTrace}
        aria-label="First step"
      >
        ⏮
      </button>
      <button type="button" className="btn btn-outline" onClick={prevStep} disabled={!hasTrace || stepIndex === 0} aria-label="Previous step">
        ◀
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={togglePlaying}
        disabled={!hasTrace || (atEnd && !isPlaying)}
        aria-pressed={isPlaying}
        data-testid="play-toggle"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button type="button" className="btn btn-outline" onClick={nextStep} disabled={!hasTrace || atEnd} aria-label="Next step">
        ▶
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => setStepIndex(traceSteps.length - 1)}
        disabled={!hasTrace}
        aria-label="Last step"
      >
        ⏭
      </button>

      <span className="font-mono text-body-sm text-charcoal tabular-nums min-w-[86px] text-center" data-testid="step-counter">
        {hasTrace ? `${stepIndex + 1} / ${traceSteps.length}` : '– / –'}
      </span>

      <label className="flex items-center gap-4 text-body-sm text-graphite">
        <span className="sr-only">Playback speed</span>
        <select
          className="field w-auto"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label="Playback speed"
          data-testid="speed-select"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>

      <span className="w-px h-[24px] bg-fog mx-4" aria-hidden="true" />

      <label className="hidden xl:flex items-center gap-4 text-body-sm text-graphite">
        <span className="sr-only">Detection algorithm</span>
        <select
          className="field w-auto"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as typeof algorithm)}
          aria-label="Detection algorithm"
        >
          <option value="auto">Auto</option>
          <option value="single-instance-wfg">WFG</option>
          <option value="multi-instance-matrix">Matrix</option>
        </select>
      </label>

      <span className="chip" data-testid="playback-kind">
        {kindLabel}
      </span>

      {detection && traceKind === 'detection' && (
        <span className="text-body-sm text-graphite" data-testid="playback-result">
          {detection.hasDeadlock ? '⚠ deadlock' : '✓ no deadlock'}
        </span>
      )}

      <button type="button" className="btn btn-ghost" onClick={clearTrace} disabled={!hasTrace}>
        Clear
      </button>
    </div>
  );
}
