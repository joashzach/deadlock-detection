import { useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import { RecoveryStrategy } from '../engine/types';
import { Chip } from './ui/Primitives';

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
    <section data-testid="recovery-panel">
      <h2 className="section-heading mb-8">Recovery</h2>

      {!detection && (
        <div className="panel p-16 mb-8">
          <p className="text-body-sm text-charcoal mb-8">Run detection first to find the deadlocked set.</p>
          <button type="button" className="btn btn-outline" onClick={runDetection}>
            Detect deadlock
          </button>
        </div>
      )}

      {detection && !detection.hasDeadlock && (
        <div className="panel p-16 mb-8" data-testid="recovery-nothing">
          <Chip tone="inverse">✓ No deadlock</Chip>
          <p className="text-body-sm text-charcoal mt-8">Nothing to recover — the system is not deadlocked.</p>
        </div>
      )}

      {detection && detection.hasDeadlock && (
        <>
          <p className="text-graphite mb-8">
            Deadlocked: <span className="font-mono text-charcoal">{deadlocked.join(', ')}</span>
          </p>

          <fieldset className="space-y-4 mb-8" disabled={!canRecover}>
            <legend className="sr-only">Recovery strategy</legend>
            {STRATEGIES.map((s) => (
              <label key={s.value} className="flex items-start gap-8 panel p-16 cursor-pointer">
                <input
                  type="radio"
                  name="recovery-strategy"
                  className="mt-4"
                  value={s.value}
                  checked={strategy === s.value}
                  data-testid={`recovery-${s.value}`}
                  onChange={() => setStrategy(s.value)}
                />
                <span>
                  <span className="font-semibold text-ink-black block mb-4">{s.label}</span>
                  <span className="block text-body-sm text-graphite">{s.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {strategy === 'TERMINATE_VICTIM' && (
            <label className="block mb-8">
              <span className="block mb-4 text-graphite">Victim</span>
              <select
                className="field"
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
            </label>
          )}

          {strategy === 'PREEMPT_RESOURCE' && (
            <div className="grid grid-cols-2 gap-8 mb-8">
              <label className="block">
                <span className="block mb-4 text-graphite">Resource</span>
                <select
                  className="field"
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
              </label>
              <label className="block">
                <span className="block mb-4 text-graphite">Count</span>
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={count}
                  aria-label="Preemption count"
                  onChange={(e) => setCount(e.target.value)}
                />
              </label>
            </div>
          )}

          <button
            type="button"
            className="btn btn-ember w-full"
            onClick={run}
            disabled={!canRecover}
            data-testid="run-recovery"
          >
            Apply recovery
          </button>
        </>
      )}

      {recoveryResult && (
        <div className="panel p-16 mt-16" data-testid="recovery-result">
          <Chip tone={recoveryResult.resolved ? 'inverse' : 'amber'}>
            {recoveryResult.resolved ? '✓ Deadlock resolved' : '… Deadlock persists'}
          </Chip>
          <p className="text-body-sm text-charcoal mt-8">
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
