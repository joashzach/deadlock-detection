import { useLabStore } from '../store/useLabStore';

const CONDITIONS = [
  { key: 'mutualExclusion', label: 'Mutual exclusion' },
  { key: 'holdAndWait', label: 'Hold and wait' },
  { key: 'noPreemption', label: 'No preemption' },
  { key: 'circularWait', label: 'Circular wait' },
] as const;

export function StatusBanner() {
  const detection = useLabStore((s) => s.detection);
  const scenario = useLabStore((s) => s.scenario);

  if (!detection) {
    return (
      <div className="border-t border-fog bg-off-white px-16 py-8 text-body-sm text-graphite" aria-live="polite">
        No detection has been run. Press <span className="font-semibold text-charcoal">Detect deadlock</span> to analyse
        the current scenario.
      </div>
    );
  }

  const conditions = CONDITIONS;

  return (
    <div className="border-t border-fog bg-off-white px-16 py-8" aria-live="polite" data-testid="status-banner">
      <div className="flex flex-wrap items-center gap-8 mb-8">
        {detection.hasDeadlock ? (
          <span className="chip chip-ember deadlock-pulse">
            <span aria-hidden="true">⚠</span> Deadlock detected: {detection.deadlockedProcessIds.join(', ')}
          </span>
        ) : (
          <span className="chip chip-inverse">
            <span aria-hidden="true">✓</span> No deadlock
          </span>
        )}
        <span className="chip">
          {detection.algorithmUsed === 'single-instance-wfg' ? 'WFG cycle detection' : 'Multi-instance matrix'}
        </span>
        {detection.hasDeadlock && detection.cycleMemberIds.length > 0 && (
          <span className="chip chip-amber">Cycle members: {detection.cycleMemberIds.join(', ')}</span>
        )}
        <span className="text-graphite">
          {scenario.processes.length} processes · {scenario.resources.length} resources
        </span>
      </div>

      <div className="flex flex-wrap gap-x-24 gap-y-4 text-body-sm">
        <span className="font-semibold text-ink-black">Coffman conditions holding now:</span>
        {conditions.map(({ key, label }) => {
          const holds = detection.coffmanStatus[key];
          const reason = detection.coffmanStatus.reasons[key];
          return (
            <span key={key} className="flex items-baseline gap-4" title={reason}>
              <span aria-hidden="true">{holds ? '●' : '○'}</span>
              <span className={holds ? 'text-charcoal font-medium' : 'text-graphite line-through'}>
                {label}
              </span>
              <span className="sr-only">{reason}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
