import { useMemo, useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import { deriveMatricesFromRAG } from '../engine/rag';
import { Chip } from './ui/Primitives';

const OUTCOME_LABEL: Record<string, string> = {
  GRANTED: 'Granted (safe)',
  DENIED_UNSAFE: 'Denied (unsafe)',
  WAIT_UNAVAILABLE: 'Must wait (not enough available)',
  ERROR_EXCEEDS_NEED: 'Error (exceeds declared Need)',
};

const OUTCOME_TONE: Record<string, 'inverse' | 'ember' | 'amber'> = {
  GRANTED: 'inverse',
  DENIED_UNSAFE: 'ember',
  WAIT_UNAVAILABLE: 'amber',
  ERROR_EXCEEDS_NEED: 'ember',
};

export function BankersPanel() {
  const scenario = useLabStore((s) => s.scenario);
  const runSafety = useLabStore((s) => s.runSafety);
  const safetyResult = useLabStore((s) => s.safetyResult);
  const submitBankersRequest = useLabStore((s) => s.submitBankersRequest);
  const requestResult = useLabStore((s) => s.requestResult);
  const setStepIndex = useLabStore((s) => s.setStepIndex);

  const [processId, setProcessId] = useState('');
  const [vector, setVector] = useState<Record<string, string>>({});

  const matrices = useMemo(() => {
    const m = deriveMatricesFromRAG(scenario);
    return { max: m.max ?? [], need: m.need ?? [], available: m.available };
  }, [scenario]);

  const disabled = scenario.processes.length === 0 || scenario.resources.length === 0;

  const buildVector = () => scenario.resources.map((r) => Number(vector[r.id] ?? 0) || 0);

  const submit = () => {
    if (!processId) return;
    submitBankersRequest(processId, buildVector());
    setStepIndex(0);
  };

  return (
    <section data-testid="bankers-panel">
      <h2 className="section-heading mb-8">Avoidance — Banker&apos;s algorithm</h2>

      <button
        type="button"
        className="btn btn-outline w-full mb-8"
        onClick={runSafety}
        disabled={disabled}
        data-testid="run-safety"
      >
        Run safety algorithm
      </button>

      {safetyResult && (
        <div className="panel p-16 mb-16" data-testid="safety-result">
          <div className="flex items-center gap-8 mb-8">
            {safetyResult.isSafe ? (
              <Chip tone="inverse">✓ Safe state</Chip>
            ) : (
              <Chip tone="ember">⚠ Unsafe state</Chip>
            )}
          </div>
          {safetyResult.isSafe ? (
            <p className="text-body-sm text-charcoal">
              Safe sequence:{' '}
              <span className="font-mono">
                &lt;{(safetyResult.safeSequence ?? []).join(', ')}&gt;
              </span>
            </p>
          ) : (
            <p className="text-body-sm text-charcoal">
              No complete safe sequence exists — a request could lead to deadlock.
            </p>
          )}
        </div>
      )}

      <div className="panel p-16">
        <p className="font-semibold text-ink-black mb-8">Resource-request algorithm</p>

        <label className="block mb-4 text-graphite" htmlFor="banker-process">
          Requesting process
        </label>
        <select
          id="banker-process"
          className="field mb-8"
          value={processId}
          onChange={(e) => setProcessId(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select process…</option>
          {scenario.processes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id}
            </option>
          ))}
        </select>

        <p className="text-graphite mb-4">Request vector (available: {matrices.available.join(', ')})</p>
        <div className="space-y-4 mb-8">
          {scenario.resources.map((r) => (
            <div key={r.id} className="flex items-center gap-8">
              <span className="font-mono w-[40px] text-charcoal">{r.id}</span>
              <input
                className="field"
                type="number"
                min={0}
                value={vector[r.id] ?? '0'}
                aria-label={`Request amount for ${r.id}`}
                disabled={disabled}
                onChange={(e) => setVector((v) => ({ ...v, [r.id]: e.target.value }))}
              />
              <span className="text-graphite text-body-sm shrink-0">Need ≤</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-ember w-full"
          onClick={submit}
          disabled={disabled || !processId}
          data-testid="submit-request"
        >
          Submit request
        </button>

        {requestResult && (
          <div className="mt-16" data-testid="request-result">
            <Chip tone={OUTCOME_TONE[requestResult.outcome] ?? 'neutral'}>
              {OUTCOME_LABEL[requestResult.outcome] ?? requestResult.outcome}
            </Chip>
            <p className="text-body-sm text-charcoal mt-8" data-testid="request-message">
              {requestResult.message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
