import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
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

const COFFMAN_CONDITIONS = [
  { key: 'mutualExclusion', label: 'Mutual exclusion' },
  { key: 'holdAndWait', label: 'Hold & wait' },
  { key: 'noPreemption', label: 'No preemption' },
  { key: 'circularWait', label: 'Circular wait' },
] as const;

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
      {/* Tab bar: 40px, Poppins 13/500, justify-between with px-16 so right gap matches left gap */}
      <div
        className="px-16 flex items-center justify-between border-b border-line bg-white shrink-0 select-none h-[40px] min-h-[40px]"
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
                'relative h-full font-poppins text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
                active
                  ? 'text-ink'
                  : 'text-muted hover:text-ink'
              )}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="rightpanel-tab-indicator"
                  className="absolute bottom-0 inset-x-0 h-[3px] bg-navy pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content: consistent unified padding 16px */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 font-mono text-[12px] p-16">
        {/* Explanation Tab */}
        {tab === 'explanation' && (
          <div role="tabpanel" id="panel-explanation" aria-labelledby="tab-explanation" className="w-full">
            {labMode === 'simulate' ? (
              simTick === 0 ? (
                <div data-testid="simulation-summary">
                  <h3 className="font-poppins text-[14px] font-semibold text-ink leading-snug mb-8">
                    Ready to simulate
                  </h3>
                  <p className="font-mono text-[12px] text-muted leading-relaxed">
                    Press Play or Step to advance both runs one tick at a time.
                  </p>
                </div>
              ) : (
                <SimulationSummary />
              )
            ) : currentStep ? (
              <div>
                <div className="flex items-center gap-6 mb-8">
                  <span className="inline-flex items-center px-6 py-1 border border-line bg-tint-bg font-mono text-[11px] text-ink" data-testid="explanation-step">
                    Step {stepIndex + 1} / {traceSteps.length}
                  </span>
                  {currentStep.highlight?.type && (
                    <span
                      className={clsx(
                        'inline-flex items-center px-6 py-1 border font-mono text-[11px]',
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
                <h3 className="font-poppins text-[14px] font-semibold text-ink leading-snug mb-8" data-testid="explanation-title">
                  {currentStep.title}
                </h3>
                <p className="font-mono text-[12px] text-muted leading-relaxed" data-testid="explanation-body">
                  {currentStep.explanation}
                </p>
              </div>
            ) : (
              <div data-testid="graph-ready">
                <h3 className="font-poppins text-[14px] font-semibold text-ink leading-snug mb-8">
                  Ready to detect
                </h3>
                <p className="font-mono text-[12px] text-muted leading-relaxed">
                  Click Detect or press Play to run deadlock detection and inspect step-by-step decisions in plain English.
                </p>
              </div>
            )}

            {/* Coffman Conditions Assessment: tiny subtle gap from steps */}
            {detection && (
              <div className="mt-6 pt-4 border-t border-line" data-testid="explanation-coffman">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-poppins text-[13px] font-semibold text-ink">
                    Coffman Conditions
                  </h4>
                  <span
                    className={clsx(
                      'font-mono text-[11px] px-6 py-0.5 border font-medium',
                      detection.hasDeadlock
                        ? 'border-danger/30 bg-danger-tint text-danger'
                        : 'border-success/30 bg-success-tint text-success'
                    )}
                  >
                    {detection.hasDeadlock ? 'Deadlock' : 'No deadlock'}
                  </span>
                </div>
                <div className="border border-line divide-y divide-line bg-white">
                  {COFFMAN_CONDITIONS.map(({ key, label }) => {
                    const holds = detection.coffmanStatus[key];
                    return (
                      <div
                        key={key}
                        className={clsx(
                          'flex items-center justify-between px-8 py-4 transition-colors',
                          holds ? 'bg-danger-tint/15' : 'bg-white'
                        )}
                      >
                        <div className="flex items-center gap-6 min-w-0">
                          <span
                            className={clsx(
                              'w-[5px] h-[5px] rounded-full shrink-0',
                              holds ? 'bg-danger' : 'bg-success'
                            )}
                            aria-hidden="true"
                          />
                          <span className="font-poppins text-[12px] font-medium text-ink truncate">
                            {label}
                          </span>
                        </div>
                        <span
                          className={clsx(
                            'font-mono text-[11px] font-medium px-5 py-0.5 border shrink-0',
                            holds
                              ? 'border-danger/30 bg-danger-tint text-danger'
                              : 'border-success/30 bg-success-tint text-success'
                          )}
                        >
                          {holds ? 'Holds' : 'Broken'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matrices Tab */}
        {tab === 'matrices' && (
          <div role="tabpanel" id="panel-matrices" aria-labelledby="tab-matrices" className="w-full">
            <MatrixEditor />
          </div>
        )}

        {/* Log Tab: every part visible without cutoff, comfortable gap */}
        {tab === 'log' && (
          <div role="tabpanel" id="panel-log" aria-labelledby="tab-log" className="w-full">
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
                          'w-full text-left font-mono text-[12px] px-8 py-2 border-l-2 transition-colors cursor-pointer rounded-none font-normal leading-relaxed whitespace-normal break-words block',
                          active
                            ? 'border-navy bg-tint-bg text-ink font-medium'
                            : 'border-transparent text-muted hover:text-ink hover:bg-tint-bg/40'
                        )}
                        onClick={() => useLabStore.getState().setStepIndex(i)}
                      >
                        {step.title}
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="font-mono text-muted text-[12px]">
                Run an algorithm to inspect the step-by-step trace log.
              </p>
            )}
          </div>
        )}

        {/* Pseudocode Tab: clean, unhighlighted tokens without blue background */}
        {tab === 'pseudocode' && (
          <div role="tabpanel" id="panel-pseudocode" aria-labelledby="tab-pseudocode" className="w-full">
            <pre className="w-full font-mono text-[12px] leading-relaxed text-ink bg-tint-bg p-12 border border-line overflow-x-auto m-0">
              {pseudocode.map((line, idx) => {
                const lineNo = idx + 1;
                const active = !isSimulating && currentStep?.pseudocodeLine === lineNo;
                return (
                  <div
                    key={lineNo}
                    className="px-4 py-1 w-full block text-ink font-normal leading-relaxed"
                    data-line={lineNo}
                    data-active={active}
                  >
                    <span className="inline-block w-24 text-muted select-none opacity-60">
                      {lineNo}
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

  const baselineDeadlock = simulator.baseline.detectionResult?.hasDeadlock ?? false;
  const policiedDeadlock = simulator.policied.detectionResult?.hasDeadlock ?? false;

  return (
    <div className="space-y-16 w-full" data-testid="simulation-summary">
      <h3 className="font-poppins text-[15px] font-semibold text-ink leading-[1.3]">
        Simulation status (tick {simulator.policied.tick})
      </h3>

      <div className="space-y-8 font-mono text-[13px]">
        <div className="p-12 border border-line bg-tint-bg">
          <p className="font-semibold text-ink mb-4">Without policies:</p>
          <p className="text-muted text-[12px] leading-relaxed">
            {baselineDeadlock
              ? `Deadlock detected among ${simulator.baseline.detectionResult?.deadlockedProcessIds.join(', ')}`
              : 'Running free of deadlock'}
          </p>
        </div>

        <div className="p-12 border border-line bg-tint-bg">
          <p className="font-semibold text-ink mb-4">With policies:</p>
          <p className="text-muted text-[12px] leading-relaxed">
            {policiedDeadlock
              ? `Deadlock detected among ${simulator.policied.detectionResult?.deadlockedProcessIds.join(', ')}`
              : 'Prevention active — system remains deadlock-free'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SimulationLog() {
  const simulator = useLabStore((s) => s.simulator);
  if (!simulator) return null;

  const events = simulator.policied.events ?? [];

  return (
    <div className="space-y-8 font-mono text-[12px] w-full" data-testid="simulation-log">
      <h3 className="font-poppins text-[13px] font-semibold text-ink leading-snug">
        Event Log (Policied run)
      </h3>
      {events.length === 0 ? (
        <p className="text-muted text-[12px]">No events recorded yet.</p>
      ) : (
        <ol className="space-y-3 max-h-[420px] overflow-y-auto divide-y divide-line/40">
          {events.map((event, i) => (
            <li key={i} className="pt-2 first:pt-0 flex items-start gap-6 font-normal leading-relaxed whitespace-normal break-words text-[12px]">
              <span className="text-muted mr-2 shrink-0">[{event.tick}]</span>
              <span className="text-ink shrink-0 font-medium">{event.processId}</span>
              <span className="text-muted flex-1 break-words">{event.action}</span>
              <span className="font-mono text-[11px] px-5 py-0.5 border border-line bg-tint-bg shrink-0">
                {event.outcome}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
