import { useMemo } from 'react';
import { useLabStore } from '../store/useLabStore';
import { SimulatorState } from '../engine/simulator';
import { ProcessExecutionState, SimulatorScriptCommand } from '../engine/types';
import { MiniGraph } from './MiniGraph';
import { Chip } from './ui/Primitives';

const STATE_META: Record<ProcessExecutionState, { glyph: string; tone: string }> = {
  Ready: { glyph: '○', tone: 'chip' },
  Running: { glyph: '▶', tone: 'chip chip-inverse' },
  Waiting: { glyph: '…', tone: 'chip chip-amber' },
  Finished: { glyph: '✓', tone: 'chip chip-inverse' },
  Deadlocked: { glyph: '⚠', tone: 'chip chip-ember' },
};

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function SimulatorView() {
  const simulator = useLabStore((s) => s.simulator);
  const initSimulator = useLabStore((s) => s.initSimulator);
  const resetSimulator = useLabStore((s) => s.resetSimulator);
  const stepSimulator = useLabStore((s) => s.stepSimulator);
  const stepSimulatorCount = useLabStore((s) => s.stepSimulatorCount);
  const isPlaying = useLabStore((s) => s.isPlaying);
  const togglePlaying = useLabStore((s) => s.togglePlaying);
  const speed = useLabStore((s) => s.speed);
  const setSpeed = useLabStore((s) => s.setSpeed);

  const finished = simulator ? simulator.baseline.isFinished && simulator.policied.isFinished : false;

  return (
    <div className="h-full overflow-y-auto p-16 space-y-16">
      <header>
        <h2 className="section-heading mb-8">Live simulator</h2>
        <p className="text-body-sm text-graphite mb-8">
          Two deterministic runs from the same scenario and scripts. The baseline ignores prevention policies; the
          policied run applies the toggles you enabled. Both advance one tick at a time.
        </p>

        {!simulator ? (
          <button type="button" className="btn btn-ember" onClick={initSimulator} data-testid="init-simulator">
            Initialise simulation
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-8" role="group" aria-label="Simulator controls">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => resetSimulator()}
              data-testid="reset-simulator"
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-ember"
              onClick={togglePlaying}
              disabled={finished && !isPlaying}
              data-testid="sim-play"
              aria-pressed={isPlaying}
            >
              {isPlaying ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => stepSimulator()}
              disabled={finished}
              data-testid="sim-step"
            >
              Step
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => stepSimulatorCount(400)}
              disabled={finished}
              data-testid="sim-run-to-end"
            >
              Run to end
            </button>
            <span className="font-mono text-body-sm text-charcoal tabular-nums" data-testid="sim-tick">
              tick {simulator.policied.tick}
            </span>
            <label className="flex items-center gap-4 text-body-sm text-graphite">
              <span className="sr-only">Simulator speed</span>
              <select
                className="field w-auto"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                aria-label="Simulator speed"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </header>

      {simulator && (
        <>
          <p className="text-body-sm" data-testid="sim-comparison">
            {simulator.baseline.detectionResult?.hasDeadlock ? (
              <span className="chip chip-ember">
                ⚠ Baseline deadlocked{(simulator.baseline.deadlockDetectedAtTick ?? 0) > 0 ? ` at tick ${simulator.baseline.deadlockDetectedAtTick}` : ''}
              </span>
            ) : (
              <span className="chip">Baseline: no deadlock</span>
            )}{' '}
            {simulator.policied.detectionResult?.hasDeadlock ? (
              <span className="chip chip-ember">⚠ Policied run deadlocked</span>
            ) : (
              <span className="chip chip-inverse">✓ Policied run free of deadlock</span>
            )}
          </p>

          <div className="grid lg:grid-cols-2 gap-16">
            <RunPanel label="Without policies" run={simulator.baseline} testId="run-baseline" />
            <RunPanel label="With policies" run={simulator.policied} testId="run-policied" />
          </div>

          <ScriptsEditor />
        </>
      )}
    </div>
  );
}

function RunPanel({ label, run, testId }: { label: string; run: SimulatorState; testId: string }) {
  const positions = useLabStore((s) => s.positions);
  const dangerIds = run.detectionResult?.deadlockedProcessIds ?? [];

  const resources = run.systemState.resources.map((r) => {
    const allocated = run.systemState.edges
      .filter((e) => e.type === 'assignment' && e.from === r.id)
      .reduce((s, e) => s + e.count, 0);
    return { id: r.id, total: r.totalInstances, allocated, free: r.totalInstances - allocated };
  });

  return (
    <section className="panel p-16" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-8 mb-8">
        <h3 className="font-semibold text-ink-black">{label}</h3>
        <span className="chip">tick {run.tick}</span>
        {run.isFinished && <span className="chip chip-inverse">finished</span>}
      </div>

      <MiniGraph
        scenario={run.systemState}
        positions={positions}
        dangerIds={dangerIds}
        label={`${label} resource allocation graph`}
      />

      <div className="flex flex-wrap gap-4 mt-8" data-testid={`${testId}-processes`}>
        {run.processStatuses.map((p) => {
          const meta = STATE_META[p.state];
          return (
            <span key={p.processId} className={meta.tone} title={`${p.processId}: ${p.state}`}>
              <span aria-hidden="true">{meta.glyph}</span>
              <span>
                {p.processId} · {p.state}
              </span>
            </span>
          );
        })}
      </div>

      <table className="w-full mt-8 font-mono text-body-sm">
        <caption className="sr-only">Resource availability for {label}</caption>
        <thead>
          <tr className="text-graphite">
            <th className="text-left font-normal">Res</th>
            <th className="text-right font-normal">Alloc</th>
            <th className="text-right font-normal">Free</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => (
            <tr key={r.id}>
              <td className="text-charcoal">{r.id}</td>
              <td className="text-right text-charcoal tabular-nums">
                {r.allocated}/{r.total}
              </td>
              <td className="text-right tabular-nums">
                {r.free === 0 ? (
                  <span className="chip chip-ember" title="no instances free">
                    <span aria-hidden="true">⚠</span>
                    <span>0</span>
                  </span>
                ) : (
                  <span className="text-charcoal">{r.free}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 max-h-[160px] overflow-y-auto">
        {run.events.length === 0 ? (
          <p className="text-body-sm text-graphite">No events yet.</p>
        ) : (
          <ol className="space-y-2 font-mono text-body-sm">
            {run.events
              .slice(-40)
              .reverse()
              .map((event, i) => (
                <li key={`${event.tick}-${i}`} className="flex items-baseline gap-8">
                  <span className="text-graphite tabular-nums shrink-0">t{event.tick}</span>
                  <span className="text-charcoal flex-1">{event.action}</span>
                  {event.policyNotice && (
                    <Chip tone="ember" title={event.policyNotice.rule}>
                      {event.policyNotice.coffmanCondition}
                    </Chip>
                  )}
                </li>
              ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function ScriptsEditor() {
  const scenario = useLabStore((s) => s.scenario);
  const scripts = useLabStore((s) => s.scripts);
  const updateScriptInstruction = useLabStore((s) => s.updateScriptInstruction);
  const addScriptInstruction = useLabStore((s) => s.addScriptInstruction);
  const removeScriptInstruction = useLabStore((s) => s.removeScriptInstruction);
  const resetScriptsFromLibrary = useLabStore((s) => s.resetScriptsFromLibrary);

  const byProcess = useMemo(() => new Map(scripts.map((s) => [s.processId, s])), [scripts]);

  return (
    <section className="panel p-16" data-testid="scripts-editor">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-semibold text-ink-black">Process scripts</h3>
        <button type="button" className="btn btn-ghost" onClick={resetScriptsFromLibrary}>
          Reset from library
        </button>
      </div>

      <div className="space-y-16">
        {scenario.processes.map((p) => {
          const script = byProcess.get(p.id);
          const instructions = script?.instructions ?? [];
          return (
            <div key={p.id}>
              <p className="font-mono text-charcoal mb-4">{p.id}</p>
              <ul className="space-y-4">
                {instructions.map((instruction, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-8">
                    <select
                      className="field w-[110px]"
                      value={instruction.type}
                      aria-label={`${p.id} instruction ${index + 1} type`}
                      onChange={(e) => {
                        const type = e.target.value as SimulatorScriptCommand['type'];
                        const next: SimulatorScriptCommand =
                          type === 'compute'
                            ? { type: 'compute', duration: 1 }
                            : {
                                type,
                                resourceId:
                                  instruction.type !== 'compute' ? instruction.resourceId : scenario.resources[0]?.id ?? '',
                                count: instruction.type !== 'compute' ? instruction.count : 1,
                              };
                        updateScriptInstruction(p.id, index, next);
                      }}
                    >
                      <option value="request">request</option>
                      <option value="release">release</option>
                      <option value="compute">compute</option>
                    </select>

                    {instruction.type === 'compute' ? (
                      <input
                        className="field w-[80px]"
                        type="number"
                        min={1}
                        value={instruction.duration}
                        aria-label={`${p.id} instruction ${index + 1} duration`}
                        onChange={(e) =>
                          updateScriptInstruction(p.id, index, {
                            type: 'compute',
                            duration: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    ) : (
                      <>
                        <select
                          className="field w-[110px]"
                          value={instruction.resourceId}
                          aria-label={`${p.id} instruction ${index + 1} resource`}
                          onChange={(e) =>
                            updateScriptInstruction(p.id, index, {
                              type: instruction.type,
                              resourceId: e.target.value,
                              count: instruction.count,
                            })
                          }
                        >
                          {scenario.resources.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.id}
                            </option>
                          ))}
                        </select>
                        <input
                          className="field w-[70px]"
                          type="number"
                          min={1}
                          value={instruction.count}
                          aria-label={`${p.id} instruction ${index + 1} count`}
                          onChange={(e) =>
                            updateScriptInstruction(p.id, index, {
                              type: instruction.type,
                              resourceId: instruction.resourceId,
                              count: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </>
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={`Remove instruction ${index + 1} from ${p.id}`}
                      onClick={() => removeScriptInstruction(p.id, index)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-ghost mt-4"
                onClick={() =>
                  addScriptInstruction(p.id, {
                    type: 'request',
                    resourceId: scenario.resources[0]?.id ?? '',
                    count: 1,
                  })
                }
                disabled={scenario.resources.length === 0}
              >
                + Add instruction
              </button>
            </div>
          );
        })}
        {scenario.processes.length === 0 && (
          <p className="text-body-sm text-graphite">Add processes to give them scripts.</p>
        )}
      </div>
    </section>
  );
}
