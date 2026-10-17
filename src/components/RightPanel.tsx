import { useState } from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
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

const OUTCOME_TONE: Record<string, string> = {
  granted: 'chip chip-inverse',
  released: 'chip chip-inverse',
  computed: 'chip',
  finished: 'chip chip-inverse',
  blocked: 'chip chip-amber',
  rejected_policy: 'chip chip-ember',
};

export function RightPanel() {
  const [tab, setTab] = useState<TabId>('explanation');
  const traceSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const detection = useLabStore((s) => s.detection);
  const traceKind = useLabStore((s) => s.traceKind);
  const labMode = useLabStore((s) => s.labMode);
  const simulator = useLabStore((s) => s.simulator);
  const reducedMotion = useReducedMotion();

  const currentStep = traceSteps[stepIndex];
  const algorithm = detection?.algorithmUsed;
  const pseudocode = pseudocodeFor(labMode === 'simulate' ? 'simulation' : traceKind, algorithm);
  const simulating = labMode === 'simulate' && simulator !== null;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="tabs" role="tablist" aria-label="Analysis panels">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === 'explanation' && (
          <div role="tabpanel" id="panel-explanation" aria-labelledby="tab-explanation" className="p-16">
            {simulating ? (
              <SimulationSummary />
            ) : currentStep ? (
              <motion.div
                key={stepIndex}
                initial={reducedMotion ? false : { y: 4, opacity: 0.85 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}
              >
                <div className="flex items-center gap-8 mb-8">
                  <span className="chip" data-testid="explanation-step">
                    Step {stepIndex + 1} / {traceSteps.length}
                  </span>
                  {currentStep.highlight?.type && (
                    <span
                      className={clsx(
                        'chip',
                        currentStep.highlight.type === 'danger' && 'chip-ember',
                        currentStep.highlight.type === 'warning' && 'chip-amber',
                        (currentStep.highlight.type === 'success' || currentStep.highlight.type === 'active') &&
                          'chip-inverse'
                      )}
                    >
                      {currentStep.highlight.type}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-ink-black mb-8" data-testid="explanation-title">
                  {currentStep.title}
                </h3>
                <p className="text-charcoal leading-relaxed" data-testid="explanation-body">
                  {currentStep.explanation}
                </p>
              </motion.div>
            ) : (
              <p className="text-graphite">
                Run an algorithm, then step through it here. Each step explains exactly what happened using the real
                values from your scenario.
              </p>
            )}
          </div>
        )}

        {tab === 'matrices' && (
          <div role="tabpanel" id="panel-matrices" aria-labelledby="tab-matrices">
            <MatrixEditor />
          </div>
        )}

        {tab === 'log' && (
          <div role="tabpanel" id="panel-log" aria-labelledby="tab-log" className="p-16">
            {simulating ? (
              <SimulationLog />
            ) : traceSteps.length > 0 ? (
              <ol className="space-y-4" data-testid="step-log">
                {traceSteps.map((step, i) => (
                  <li key={step.id}>
                    <button
                      type="button"
                      className={clsx(
                        'w-full text-left font-mono text-body-sm px-8 py-4 border-l-2',
                        i === stepIndex
                          ? 'border-ember bg-obsidian text-off-white'
                          : 'border-transparent text-charcoal hover:underline'
                      )}
                      onClick={() => useLabStore.getState().setStepIndex(i)}
                    >
                      <span className="text-graphite">{String(i + 1).padStart(2, '0')}</span> {step.title}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-graphite">The trace log is empty until an algorithm runs.</p>
            )}
          </div>
        )}

        {tab === 'pseudocode' && (
          <div role="tabpanel" id="panel-pseudocode" aria-labelledby="tab-pseudocode" className="p-16">
            <pre className="font-mono text-body-sm leading-relaxed overflow-x-auto">
              {pseudocode.map((line, i) => {
                const lineNo = i + 1;
                const active = !simulating && currentStep?.pseudocodeLine === lineNo;
                return (
                  <div
                    key={lineNo}
                    className={clsx(
                      'px-8 border-l-2 whitespace-pre',
                      active ? 'border-ember bg-obsidian text-off-white' : 'border-transparent text-charcoal'
                    )}
                    data-line={lineNo}
                    data-active={active}
                  >
                    <span className="text-graphite select-none">{String(lineNo).padStart(2, ' ')} </span>
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
      <li className="mb-4">
        <span className="font-semibold text-ink-black">{label}:</span>{' '}
        <span className="text-charcoal">
          tick {run.tick} · {finished}/{run.processStatuses.length} finished ·{' '}
          {run.detectionResult?.hasDeadlock
            ? `deadlock among ${run.detectionResult.deadlockedProcessIds.join(', ')}`
            : 'no deadlock'}
        </span>
      </li>
    );
  };
  return (
    <div data-testid="simulation-summary">
      <h3 className="font-semibold text-ink-black mb-8">Live simulation</h3>
      <p className="text-graphite mb-8">
        Two identical runs: the left one ignores prevention policies, the right one applies the policies you enabled.
      </p>
      <ul className="text-body-sm">
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
    return <p className="text-graphite">No events yet — press Play or Step to advance the simulation.</p>;
  }
  return (
    <ol className="space-y-4 font-mono text-body-sm" data-testid="simulation-log">
      {events.map((event, i) => (
        <li key={i} className="flex items-start gap-8 border-l-2 border-transparent px-8 py-4">
          <span className="text-graphite tabular-nums shrink-0">t{event.tick}</span>
          <span className="shrink-0 text-charcoal">{event.processId}</span>
          <span className="flex-1 text-charcoal">{event.action}</span>
          <span className={clsx(OUTCOME_TONE[event.outcome] ?? 'chip')}>{event.outcome}</span>
        </li>
      ))}
    </ol>
  );
}
