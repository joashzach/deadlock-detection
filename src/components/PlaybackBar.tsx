import { useLabStore } from '../store/useLabStore';

export function PlaybackBar() {
  const detectionSteps = useLabStore((s) => s.detectionSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const detection = useLabStore((s) => s.detection);
  const setStepIndex = useLabStore((s) => s.setStepIndex);
  const nextStep = useLabStore((s) => s.nextStep);
  const prevStep = useLabStore((s) => s.prevStep);
  const runDetection = useLabStore((s) => s.runDetection);
  const algorithm = useLabStore((s) => s.algorithm);
  const setAlgorithm = useLabStore((s) => s.setAlgorithm);

  const hasTrace = detectionSteps.length > 0;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 panel px-16 py-8 flex items-center gap-8 shadow-none">
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
      <button type="button" className="btn btn-outline" onClick={prevStep} disabled={!hasTrace} aria-label="Previous step">
        ◀
      </button>
      <span className="font-mono text-body-sm text-charcoal tabular-nums min-w-[72px] text-center" data-testid="step-counter">
        {hasTrace ? `${stepIndex + 1} / ${detectionSteps.length}` : '– / –'}
      </span>
      <button type="button" className="btn btn-outline" onClick={nextStep} disabled={!hasTrace} aria-label="Next step">
        ▶
      </button>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => setStepIndex(detectionSteps.length - 1)}
        disabled={!hasTrace}
        aria-label="Last step"
      >
        ⏭
      </button>

      <span className="w-px h-[24px] bg-fog mx-4" aria-hidden="true" />

      <label className="lg:hidden flex items-center gap-4 text-body-sm">
        <span className="sr-only">Algorithm</span>
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

      {detection && (
        <span className="text-body-sm text-graphite" data-testid="playback-result">
          {detection.hasDeadlock ? '⚠ deadlock' : '✓ no deadlock'}
        </span>
      )}
    </div>
  );
}
