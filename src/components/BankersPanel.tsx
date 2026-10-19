import { useMemo, useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import { deriveMatricesFromRAG } from '../engine/rag';
import { Button } from './ui/Button';

const OUTCOME_LABEL: Record<string, string> = {
  GRANTED: 'Granted (safe)',
  DENIED_UNSAFE: 'Denied (unsafe)',
  WAIT_UNAVAILABLE: 'Must wait (not enough available)',
  ERROR_EXCEEDS_NEED: 'Error (exceeds declared Need)',
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
    <section data-testid="bankers-panel" className="space-y-12">
      <h2 className="font-poppins text-panel-heading font-semibold text-ink">Avoidance — Banker&apos;s algorithm</h2>

      <Button
        variant="secondary"
        className="w-full"
        onClick={runSafety}
        disabled={disabled}
        data-testid="run-safety"
      >
        Run safety algorithm
      </Button>

      {safetyResult && (
        <div className="border border-line bg-white p-12" data-testid="safety-result">
          <div className="flex items-center gap-8 mb-8">
            {safetyResult.isSafe ? (
              <span className="inline-flex items-center px-8 py-4 border border-success/30 bg-success-tint font-mono text-[12px] text-success">
                ✓ Safe state
              </span>
            ) : (
              <span className="inline-flex items-center px-8 py-4 border border-danger/30 bg-danger-tint font-mono text-[12px] text-danger">
                ⚠ Unsafe state
              </span>
            )}
          </div>
          {safetyResult.isSafe ? (
            <p className="font-mono text-[12px] text-muted">
              Safe sequence:{' '}
              <span className="font-mono text-ink font-semibold">
                &lt;{(safetyResult.safeSequence ?? []).join(', ')}&gt;
              </span>
            </p>
          ) : (
            <p className="font-mono text-[12px] text-muted">
              No complete safe sequence exists — a request could lead to deadlock.
            </p>
          )}
        </div>
      )}

      <div className="border border-line bg-white p-12 space-y-12">
        <p className="font-poppins text-[13px] font-semibold text-ink">Resource-request algorithm</p>

        <div>
          <label className="block mb-4 font-mono text-[12px] text-muted" htmlFor="banker-process">
            Requesting process
          </label>
          <select
            id="banker-process"
            className="w-full h-40 px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy cursor-pointer"
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
        </div>

        <div>
          <p className="font-mono text-[12px] text-muted mb-6">
            Request vector (available: {matrices.available.join(', ')})
          </p>
          <div className="space-y-6">
            {scenario.resources.map((r) => (
              <div key={r.id} className="flex items-center gap-8">
                <span className="font-mono text-[13px] w-[36px] text-ink font-medium">{r.id}</span>
                <input
                  className="w-full h-40 px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy text-center"
                  type="number"
                  min={0}
                  value={vector[r.id] ?? '0'}
                  aria-label={`Request amount for ${r.id}`}
                  disabled={disabled}
                  onChange={(e) => setVector((v) => ({ ...v, [r.id]: e.target.value }))}
                />
                <span className="font-mono text-[12px] text-muted shrink-0">Need ≤</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={submit}
          disabled={disabled || !processId}
          data-testid="submit-request"
        >
          Submit request
        </Button>

        {requestResult && (
          <div className="mt-12 p-8 border border-line bg-tint-bg" data-testid="request-result">
            <span className="font-mono text-[12px] text-ink font-semibold">
              {OUTCOME_LABEL[requestResult.outcome] ?? requestResult.outcome}
            </span>
            <p className="font-mono text-[12px] text-muted mt-4" data-testid="request-message">
              {requestResult.message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
