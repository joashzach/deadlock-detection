import { useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import { RecoveryStrategy } from '../engine/types';
import { Button } from './ui/Button';

const STRATEGIES: Array<{ value: RecoveryStrategy; label: string; hint: string }> = [
  { value: 'TERMINATE_VICTIM', label: 'Terminate victim', hint: 'Remove one deadlocked process (fewest resources held, or pick one).' },
  { value: 'TERMINATE_ALL', label: 'Terminate all', hint: 'Remove every process in the deadlocked set.' },
  { value: 'PREEMPT_RESOURCE', label: 'Preempt a resource', hint: 'Take a resource back from a deadlocked process.' },
];

export function RecoveryPanel() {
  const scenario = useLabStore((s) => s.scenario);
  const detection = useLabStore((s) => s.detection);
  const applyRecovery = useLabStore((s) => s.applyRecovery);
  const recoveryResult = useLabStore((s) => s.recoveryResult);
  const runDetection = useLabStore((s) => s.runDetection);

  const [strategy, setStrategy] = useState<RecoveryStrategy>('TERMINATE_VICTIM');
  const [victim, setVictim] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [count, setCount] = useState('1');

  const deadlocked = detection?.deadlockedProcessIds ?? [];
  const canRecover = detection?.hasDeadlock === true && deadlocked.length > 0;

  const run = () => {
    applyRecovery(strategy, {
      ...(strategy === 'TERMINATE_VICTIM' && victim ? { victimProcessId: victim } : {}),
      ...(strategy === 'PREEMPT_RESOURCE'
        ? { preemptResourceId: resourceId || undefined, preemptCount: Number(count) || 1 }
        : {}),
    });
  };

  return (
    <section data-testid="recovery-panel" className="space-y-12">
      <h2 className="font-poppins text-panel-heading font-semibold text-ink">Recovery</h2>

      {!detection && (
        <div className="border border-line bg-white p-12">
          <p className="font-mono text-[12px] text-muted mb-8">Run detection first to find the deadlocked set.</p>
          <Button variant="secondary" onClick={runDetection}>
            Detect deadlock
          </Button>
        </div>
      )}

      {detection && !detection.hasDeadlock && (
        <div className="border border-line bg-white p-12" data-testid="recovery-nothing">
          <span className="inline-flex items-center px-8 py-4 border border-success/30 bg-success-tint font-mono text-[12px] text-success">
            ✓ No deadlock
          </span>
          <p className="font-mono text-[12px] text-muted mt-8">Nothing to recover — the system is not deadlocked.</p>
        </div>
      )}

      {detection && detection.hasDeadlock && (
        <>
          <p className="font-mono text-[13px] text-muted">
            Deadlocked: <span className="font-mono text-danger font-semibold">{deadlocked.join(', ')}</span>
          </p>

          <fieldset className="space-y-6" disabled={!canRecover}>
            <legend className="sr-only">Recovery strategy</legend>
            {STRATEGIES.map((s) => (
              <label key={s.value} className="flex items-start gap-8 border border-line bg-white p-12 cursor-pointer select-none">
                <input
                  type="radio"
                  name="recovery-strategy"
                  className="mt-4 rounded-none border-line text-navy focus:ring-0 focus:outline-navy"
                  value={s.value}
                  checked={strategy === s.value}
                  data-testid={`recovery-${s.value}`}
                  onChange={() => setStrategy(s.value)}
                />
                <div>
                  <span className="font-poppins text-[13px] font-semibold text-ink block mb-2">{s.label}</span>
                  <span className="block font-mono text-[12px] leading-relaxed text-muted">{s.hint}</span>
                </div>
              </label>
            ))}
          </fieldset>

          {strategy === 'TERMINATE_VICTIM' && (
            <div>
              <label className="block mb-4 font-mono text-[12px] text-muted" htmlFor="victim-select">
                Victim
              </label>
              <select
                id="victim-select"
                className="w-full h-40 px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy cursor-pointer"
                value={victim}
                aria-label="Victim process"
                onChange={(e) => setVictim(e.target.value)}
              >
                <option value="">Auto (fewest resources held)</option>
                {deadlocked.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {strategy === 'PREEMPT_RESOURCE' && (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block mb-4 font-mono text-[12px] text-muted" htmlFor="preempt-resource">
                  Resource
                </label>
                <select
                  id="preempt-resource"
                  className="w-full h-40 px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy cursor-pointer"
                  value={resourceId}
                  aria-label="Resource to preempt"
                  onChange={(e) => setResourceId(e.target.value)}
                >
                  <option value="">Auto</option>
                  {scenario.resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-4 font-mono text-[12px] text-muted" htmlFor="preempt-count">
                  Count
                </label>
                <input
                  id="preempt-count"
                  className="w-full h-40 px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy text-center"
                  type="number"
                  min={1}
                  value={count}
                  aria-label="Preemption count"
                  onChange={(e) => setCount(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full"
            onClick={run}
            disabled={!canRecover}
            data-testid="run-recovery"
          >
            Apply recovery
          </Button>
        </>
      )}

      {recoveryResult && (
        <div className="border border-line bg-white p-12" data-testid="recovery-result">
          <span
            className={`inline-flex items-center px-8 py-4 border font-mono text-[12px] ${
              recoveryResult.resolved
                ? 'border-success/30 bg-success-tint text-success'
                : 'border-warning/30 bg-warning-tint text-warning'
            }`}
          >
            {recoveryResult.resolved ? '✓ Deadlock resolved' : '… Deadlock persists'}
          </span>
          <p className="font-mono text-[12px] text-muted mt-8">
            Re-detection found{' '}
            {recoveryResult.postDetection.hasDeadlock
              ? `remaining deadlocked processes: ${recoveryResult.postDetection.deadlockedProcessIds.join(', ')}`
              : 'no remaining deadlock'}
            .
          </p>
        </div>
      )}
    </section>
  );
}
