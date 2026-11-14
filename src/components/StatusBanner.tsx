import clsx from 'clsx';
import { useLabStore } from '../store/useLabStore';

export function StatusBanner({ className }: { className?: string } = {}) {
  const detection = useLabStore((s) => s.detection);
  const safetyResult = useLabStore((s) => s.safetyResult);
  const requestResult = useLabStore((s) => s.requestResult);
  const recoveryResult = useLabStore((s) => s.recoveryResult);
  const simulator = useLabStore((s) => s.simulator);

  if (!detection) {
    return (
      <div
        className={clsx('flex items-center gap-8 font-mono text-[12px] text-muted', className)}
        aria-live="polite"
        data-testid="status-banner"
      >
        <span aria-hidden="true">●</span>
        <span>Simulator idle</span>
        <span className="sr-only">No detection has been run. Press Detect to analyse the current scenario.</span>
      </div>
    );
  }

  return (
    <div
      className={clsx('flex flex-wrap items-center gap-8 font-mono text-[11px] leading-none text-ink select-none', className)}
      aria-live="polite"
      data-testid="status-banner"
    >
      {/* Result chip */}
      {detection.hasDeadlock ? (
        <span className="inline-flex items-center px-8 py-2 border border-danger/30 bg-danger-tint text-danger font-medium shrink-0">
          <span aria-hidden="true" className="mr-4">⚠</span>
          Deadlock detected: {detection.deadlockedProcessIds.join(', ')}
        </span>
      ) : (
        <span className="inline-flex items-center px-8 py-2 border border-success/30 bg-success-tint text-success font-medium shrink-0">
          <span aria-hidden="true" className="mr-4">✓</span>
          No deadlock
        </span>
      )}

      {/* Algorithm */}
      <span className="inline-flex items-center px-6 py-2 border border-line bg-tint-bg text-muted shrink-0">
        {detection.algorithmUsed === 'single-instance-wfg' ? 'WFG' : 'Matrix'}
      </span>

      {/* Optional test hooks */}
      {safetyResult && (
        <span
          className={`shrink-0 ${safetyResult.isSafe ? 'text-success' : 'text-danger'}`}
          data-testid="banner-safety"
        >
          {safetyResult.isSafe
            ? `✓ Safe · <${(safetyResult.safeSequence ?? []).join(', ')}>`
            : '⚠ Unsafe'}
        </span>
      )}

      {requestResult && (
        <span className="shrink-0 text-muted" data-testid="banner-request">
          Request {requestResult.outcome}
        </span>
      )}

      {recoveryResult && (
        <span
          className={`shrink-0 ${recoveryResult.resolved ? 'text-success' : 'text-warning'}`}
          data-testid="banner-recovery"
        >
          {recoveryResult.resolved ? '✓ Recovery resolved' : '… Incomplete'}
        </span>
      )}

      {simulator && (
        <span className="sr-only" data-testid="banner-simulator">
          Tick {simulator.policied.tick}
        </span>
      )}
    </div>
  );
}
