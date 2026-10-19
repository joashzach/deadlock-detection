import { useLabStore } from '../store/useLabStore';

const CONDITIONS = [
  { key: 'mutualExclusion', label: 'Mutual exclusion' },
  { key: 'holdAndWait', label: 'Hold & wait' },
  { key: 'noPreemption', label: 'No preemption' },
  { key: 'circularWait', label: 'Circular wait' },
] as const;

export function StatusBanner() {
  const detection = useLabStore((s) => s.detection);
  const labMode = useLabStore((s) => s.labMode);
  const safetyResult = useLabStore((s) => s.safetyResult);
  const requestResult = useLabStore((s) => s.requestResult);
  const recoveryResult = useLabStore((s) => s.recoveryResult);
  const simulator = useLabStore((s) => s.simulator);

  const speed = useLabStore((s) => s.speed);
  const currentTick = simulator?.policied.tick ?? 0;

  if (!detection) {
    return (
      <footer
        className="shrink-0 border-t border-line bg-white flex items-center font-mono text-[12px] leading-none text-ink whitespace-nowrap overflow-hidden select-none z-20 h-[32px] px-[24px]"
        style={{
          height: 'var(--status-h)',
          minHeight: 'var(--status-h)',
          maxHeight: 'var(--status-h)',
        }}
        aria-live="polite"
        data-testid="status-banner"
      >
        <span className="flex items-center gap-[8px]">
          <span className="text-muted" aria-hidden="true">●</span>
          <span>{labMode === 'simulate' ? 'Simulator idle' : 'Simulator idle'}</span>
          <span className="sr-only">No detection has been run. Press Detect to analyse the current scenario.</span>
        </span>
        <span className="hidden max-[1179px]:inline-flex ml-auto items-center text-muted text-[11px]">
          tick {currentTick} · {speed}×
        </span>
      </footer>
    );
  }

  return (
    <footer
      className="shrink-0 border-t border-line bg-white flex items-center gap-[16px] font-mono text-[12px] leading-none text-ink whitespace-nowrap overflow-x-auto overflow-y-hidden select-none z-20 h-[32px] px-[24px]"
      style={{
        height: 'var(--status-h)',
        minHeight: 'var(--status-h)',
        maxHeight: 'var(--status-h)',
      }}
      aria-live="polite"
      data-testid="status-banner"
    >
      {/* Result chip */}
      {detection.hasDeadlock ? (
        <span className="inline-flex items-center px-[8px] py-[2px] border border-danger/30 bg-danger-tint text-danger font-medium shrink-0 text-[11px]">
          <span aria-hidden="true" className="mr-[4px]">⚠</span>
          Deadlock detected: {detection.deadlockedProcessIds.join(', ')}
        </span>
      ) : (
        <span className="inline-flex items-center px-[8px] py-[2px] border border-success/30 bg-success-tint text-success font-medium shrink-0 text-[11px]">
          <span aria-hidden="true" className="mr-[4px]">✓</span>
          No deadlock
        </span>
      )}

      {/* Algorithm */}
      <span className="inline-flex items-center px-[6px] py-[2px] border border-line bg-tint-bg text-muted shrink-0 text-[11px]">
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

      {/* Divider */}
      <div className="h-[14px] w-[1px] bg-line shrink-0" aria-hidden="true" />

      {/* Coffman conditions in one line */}
      <div className="flex items-center gap-[12px] shrink-0 text-[12px]">
        <span className="text-muted">Coffman:</span>
        {CONDITIONS.map(({ key, label }) => {
          const holds = detection.coffmanStatus[key];
          const reason = detection.coffmanStatus.reasons[key];
          return (
            <span key={key} className="inline-flex items-center gap-[4px]" title={reason}>
              <span className={holds ? 'text-danger font-bold' : 'text-muted'} aria-hidden="true">
                {holds ? '●' : '○'}
              </span>
              <span className={holds ? 'text-ink font-medium' : 'text-muted line-through'}>
                {label}
              </span>
              <span className="sr-only">{reason}</span>
            </span>
          );
        })}
      </div>
    </footer>
  );
}
