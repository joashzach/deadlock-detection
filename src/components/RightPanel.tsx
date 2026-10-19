import { useState } from 'react';
import clsx from 'clsx';
import { useLabStore } from '../store/useLabStore';
import { pseudocodeFor } from '../lib/pseudocode';
import { MatrixEditor } from './MatrixEditor';

type TabId = 'explanation' | 'matrices' | 'log' | 'pseudocode';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'matrices', label: 'Matrices' },
  { id: 'log', label: 'Log' },
  { id: 'pseudocode', label: 'Pseudocode' },
];

export function RightPanel() {
  const [tab, setTab] = useState<TabId>('explanation');
  const traceSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const detection = useLabStore((s) => s.detection);
  const traceKind = useLabStore((s) => s.traceKind);
  const labMode = useLabStore((s) => s.labMode);
  const simulator = useLabStore((s) => s.simulator);

  const currentStep = traceSteps[stepIndex];
  const algorithm = detection?.algorithmUsed;
  const pseudocode = pseudocodeFor(labMode === 'simulate' ? 'simulation' : traceKind, algorithm);
  const isSimulating = labMode === 'simulate' && simulator !== null;
  const simTick = simulator?.policied.tick ?? 0;

  return (
    <div className="h-full flex flex-col min-h-0 bg-white select-none overflow-hidden">
      {/* Tab bar: 44px, Poppins 13/500, gap 16, 1px bottom border; active = ink + 2px navy underline overlapping the border, inactive = muted */}
      <div
        className="px-[24px] flex items-center gap-[20px] border-b border-line bg-white shrink-0 overflow-x-auto overflow-y-hidden select-none h-[44px] min-h-[44px]"
        role="tablist"
        aria-label="Analysis panels"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              className={clsx(
                'h-full font-poppins text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center border-b-2 rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
                active
                  ? 'text-ink font-semibold border-navy'
                  : 'text-muted border-transparent hover:text-ink'
              )}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: padding 24px */}
      <div
        className="flex-1 overflow-y-auto min-h-0 font-mono text-[14px] p-[24px]"
      >
        {/* Explanation Tab */}
        {tab === 'explanation' && (
          <div role="tabpanel" id="panel-explanation" aria-labelledby="tab-explanation">
            {labMode === 'simulate' ? (
              simTick === 0 ? (
                // Reference image idle state: Poppins 17/600 heading + 8px gap + mono 14/1.8 muted sentence
                <div data-testid="simulation-summary">
                  <h3 className="text-panel-heading mb-8">
                    Ready to simulate
                  </h3>
                  <p className="text-body-mono">
                    Press Play or Step to advance both runs one tick at a time.
                  </p>
                </div>
              ) : (
                <SimulationSummary />
              )
            ) : currentStep ? (
              <div>
                <div className="flex items-center gap-8 mb-8">
                  <span className="inline-flex items-center px-8 py-2 border border-line bg-tint-bg font-mono text-[12px] text-ink" data-testid="explanation-step">
                    Step {stepIndex + 1} / {traceSteps.length}
                  </span>
                  {currentStep.highlight?.type && (
                    <span
                      className={clsx(
                        'inline-flex items-center px-8 py-2 border font-mono text-[12px]',
                        currentStep.highlight.type === 'danger' && 'border-danger/30 bg-danger-tint text-danger',
                        currentStep.highlight.type === 'warning' && 'border-warning/30 bg-warning-tint text-warning',
                        (currentStep.highlight.type === 'success' || currentStep.highlight.type === 'active') &&
                          'border-success/30 bg-success-tint text-success'
                      )}
                    >
                      {currentStep.highlight.type}
                    </span>
                  )}
                </div>
                <h3 className="text-panel-heading mb-8" data-testid="explanation-title">
                  {currentStep.title}
                </h3>
                <p className="text-body-mono" data-testid="explanation-body">
                  {currentStep.explanation}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-panel-heading mb-8">
                  Ready to simulate
                </h3>
                <p className="text-body-mono">
                  Run detection or start playback to inspect step-by-step decisions in plain English.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Matrices Tab */}
        {tab === 'matrices' && (
          <div role="tabpanel" id="panel-matrices" aria-labelledby="tab-matrices" className="-m-8">
            <MatrixEditor />
          </div>
        )}

        {/* Log Tab */}
        {tab === 'log' && (
          <div role="tabpanel" id="panel-log" aria-labelledby="tab-log">
            {isSimulating ? (
              <SimulationLog />
            ) : traceSteps.length > 0 ? (
              <ol className="space-y-4" data-testid="step-log">
                {traceSteps.map((step, i) => {
                  const active = i === stepIndex;
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        className={clsx(
                          'w-full text-left font-mono text-[13px] px-8 py-6 border-l-2 transition-colors cursor-pointer rounded-none',
                          active
                            ? 'border-navy bg-tint-bg text-ink font-semibold'
                            : 'border-transparent text-muted hover:text-ink'
                        )}
                        onClick={() => useLabStore.getState().setStepIndex(i)}
                      >
                        <span className="text-muted mr-8">{String(i + 1).padStart(2, '0')}</span>
                        {step.title}
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="font-mono text-[13px] text-muted">No trace log recorded yet.</p>
            )}
          </div>
        )}

        {/* Pseudocode Tab: wrapped, never clipped */}
        {tab === 'pseudocode' && (
          <div role="tabpanel" id="panel-pseudocode" aria-labelledby="tab-pseudocode" className="font-mono text-[13px]">
            <div className="font-poppins text-section-label uppercase tracking-wider text-muted font-semibold mb-12">
              Algorithm: {algorithm === 'single-instance-wfg' ? 'Single-Instance WFG Cycle' : 'Multi-Instance Matrix Reduction'}
            </div>
            <pre className="whitespace-pre-wrap break-words leading-relaxed overflow-x-hidden font-mono text-[13px] text-ink">
              {pseudocode.map((line, i) => {
                const lineNo = i + 1;
                const active = !isSimulating && currentStep?.pseudocodeLine === lineNo;
                return (
                  <div
                    key={lineNo}
                    className={clsx(
                      'px-8 py-2 border-l-2',
                      active
                        ? 'border-navy bg-tint-bg text-ink font-semibold'
                        : 'border-transparent text-muted'
                    )}
                    data-line={lineNo}
                    data-active={active}
                  >
                    <span className="text-line select-none mr-8 font-mono">
                      {String(lineNo).padStart(2, ' ')}
                    </span>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function SimulationSummary() {
  const simulator = useLabStore((s) => s.simulator);
  if (!simulator) return null;
  const { baseline, policied } = simulator;

  const describe = (label: string, run: typeof baseline) => {
    const finished = run.processStatuses.filter((p) => p.state === 'Finished').length;
    return (
      <li className="mb-8">
        <span className="font-semibold text-ink">{label}:</span>{' '}
        <span className="text-muted">
          tick {run.tick} · {finished}/{run.processStatuses.length} finished ·{' '}
          {run.detectionResult?.hasDeadlock
            ? `deadlock among ${run.detectionResult.deadlockedProcessIds.join(', ')}`
            : 'no deadlock'}
        </span>
      </li>
    );
  };

  const workVector = policied.systemState.resources.map((r) => {
    const allocated = policied.systemState.edges
      .filter((e) => e.type === 'assignment' && e.from === r.id)
      .reduce((s, e) => s + e.count, 0);
    return r.totalInstances - allocated;
  });

  const finishVector = policied.processStatuses.map((p) => (p.state === 'Finished' ? 'T' : 'F'));

  return (
    <div data-testid="simulation-summary">
      <h3 className="text-panel-heading mb-12">
        Live simulation
      </h3>
      <p className="text-body-mono mb-16">
        Two identical runs: the left one ignores prevention policies, the right one applies the policies you enabled.
      </p>

      {/* Work / Finish vectors */}
      <div className="border border-line bg-tint-bg p-12 mb-16 font-mono text-[13px] space-y-4">
        <div>Work = [{workVector.join(',')}]</div>
        <div>Finish = [{finishVector.join(',')}]</div>
      </div>

      <ul className="text-[13px] space-y-4">
        {describe('Without policies', baseline)}
        {describe('With policies', policied)}
      </ul>
    </div>
  );
}

function SimulationLog() {
  const simulator = useLabStore((s) => s.simulator);
  if (!simulator) return null;
  const events = simulator.policied.events;
  if (events.length === 0) {
    return <p className="font-mono text-[13px] text-muted">No events yet — press Play or Step to advance the simulation.</p>;
  }
  return (
    <ol className="space-y-4 font-mono text-[13px]" data-testid="simulation-log">
      {events.map((event, i) => (
        <li key={i} className="flex items-start gap-8 border-l-2 border-transparent px-8 py-4">
          <span className="text-muted tabular-nums shrink-0">t{event.tick}</span>
          <span className="shrink-0 text-ink font-semibold">{event.processId}</span>
          <span className="flex-1 text-muted">{event.action}</span>
          <span className="inline-flex items-center px-6 py-2 border border-line bg-tint-bg font-mono text-[11px] text-ink">
            {event.outcome}
          </span>
        </li>
      ))}
    </ol>
  );
}
