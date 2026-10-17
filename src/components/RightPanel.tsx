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
  const detectionSteps = useLabStore((s) => s.detectionSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const detection = useLabStore((s) => s.detection);
  const traceKind = useLabStore((s) => s.traceKind);

  const currentStep = detectionSteps[stepIndex];
  const algorithm = detection?.algorithmUsed;
  const pseudocode = pseudocodeFor(traceKind, algorithm);

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
            {currentStep ? (
              <>
                <div className="flex items-center gap-8 mb-8">
                  <span className="chip">Step {stepIndex + 1} / {detectionSteps.length}</span>
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
                <h3 className="font-semibold text-ink-black mb-8">{currentStep.title}</h3>
                <p className="text-charcoal leading-relaxed">{currentStep.explanation}</p>
              </>
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
            {detectionSteps.length > 0 ? (
              <ol className="space-y-4" data-testid="step-log">
                {detectionSteps.map((step, i) => (
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
                const active = currentStep?.pseudocodeLine === lineNo;
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
