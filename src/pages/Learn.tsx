import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLabStore } from '../store/useLabStore';
import { detectDeadlock } from '../engine/detect';
import { COMPLEXITY } from '../lib/complexity';
import {
  BANKER_SAFETY_PSEUDOCODE,
  CYCLE_PSEUDOCODE,
  MATRIX_PSEUDOCODE,
  RECOVERY_PSEUDOCODE,
} from '../lib/pseudocode';

const PANELS = [
  'What is a deadlock',
  'Four Coffman conditions',
  'RAG vs WFG',
  'Detection',
  'Prevention vs Avoidance vs Recovery',
  'Complexity',
] as const;

type PanelId = (typeof PANELS)[number];

const CONDITION_KEYS = ['mutualExclusion', 'holdAndWait', 'noPreemption', 'circularWait'] as const;
type ConditionKey = (typeof CONDITION_KEYS)[number];

const CONDITION_LABELS: Record<ConditionKey, string> = {
  mutualExclusion: 'Mutual exclusion',
  holdAndWait: 'Hold and wait',
  noPreemption: 'No preemption',
  circularWait: 'Circular wait',
};

const slug = (panel: string) => panel.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function Learn() {
  const scenario = useLabStore((s) => s.scenario);
  const [panel, setPanel] = useState<PanelId>('What is a deadlock');
  const [guesses, setGuesses] = useState<Partial<Record<ConditionKey, boolean>>>({});

  const assessment = useMemo(() => {
    try {
      return detectDeadlock(scenario).result.coffmanStatus;
    } catch {
      return null;
    }
  }, [scenario]);

  const answered = CONDITION_KEYS.filter((key) => guesses[key] !== undefined);
  const correct = answered.filter((key) => guesses[key] === assessment?.[key]);
  const assessable = scenario.processes.length > 0 && scenario.resources.length > 0;

  return (
    <div className="max-w-page mx-auto px-16 py-40 space-y-24">
      <header>
        <h1 className="section-heading text-heading-sm mb-8">Learn</h1>
        <p className="text-charcoal max-w-[70ch]">
          The theory behind the Lab. The Coffman checklist below is bound to your current scenario — change the Lab and
          it updates.
        </p>
      </header>

      <div className="flex flex-wrap gap-8" role="tablist" aria-label="Theory panels">
        {PANELS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            id={`learn-tab-${slug(p)}`}
            aria-selected={panel === p}
            aria-controls="learn-panel"
            className={panel === p ? 'chip chip-inverse' : 'chip'}
            onClick={() => setPanel(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <section
        className="panel p-24"
        role="tabpanel"
        id="learn-panel"
        aria-labelledby={`learn-tab-${slug(panel)}`}
        tabIndex={-1}
      >
        {panel === 'What is a deadlock' && (
          <div className="space-y-16 text-charcoal max-w-[75ch]">
            <p>
              A deadlock is a state where a set of processes are each waiting for a resource held by another process in
              the same set, so none of them can ever proceed. They are not merely slow — they will never finish without
              outside intervention.
            </p>
            <p>
              Deadlock is one of several liveness problems. It is distinct from <em>starvation</em>, where a process is
              indefinitely postponed but the system as a whole keeps making progress, and from a <em>livelock</em>,
              where processes keep changing state without doing useful work.
            </p>
          </div>
        )}

        {panel === 'Four Coffman conditions' && (
          <div className="space-y-16">
            <p className="text-charcoal max-w-[75ch]">
              A deadlock can occur only if all four conditions below hold simultaneously. Breaking any one of them
              prevents deadlock entirely. Read each one, commit to an answer, then check yourself against what the engine
              found in your current scenario.
            </p>

            {(!assessment || !assessable) && (
              <p className="chip chip-amber" role="status" data-testid="coffman-unassessable">
                <span aria-hidden="true">…</span>
                <span>Your current scenario has no process or no resource, so there is nothing to assess yet.</span>
              </p>
            )}

            <ul className="space-y-16" data-testid="coffman-checklist">
              {CONDITION_KEYS.map((key) => {
                const holds = assessment?.[key] ?? false;
                const reason = assessment?.reasons[key] ?? 'Add at least one process and one resource in the Lab to assess this condition.';
                const guess = guesses[key];
                const isAnswered = guess !== undefined;
                const matched = guess === holds;
                return (
                  <li key={key} className="panel p-16">
                    <div className="flex flex-wrap items-center gap-8 mb-8">
                      <span className="font-semibold text-ink-black">{CONDITION_LABELS[key]}</span>
                      <span
                        className={holds ? 'chip chip-inverse' : 'chip'}
                        aria-label={holds ? 'the engine found this condition holds' : 'the engine found this condition does not hold'}
                      >
                        <span aria-hidden="true">{holds ? '●' : '○'}</span>
                        <span>engine: {holds ? 'holds' : 'does not hold'}</span>
                      </span>
                    </div>

                    <p className="text-body-sm text-graphite mb-8">{reason}</p>

                    {!isAnswered ? (
                      <div className="flex flex-wrap items-center gap-8">
                        <span className="text-body-sm text-graphite">Does it hold right now?</span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          data-testid={`guess-holds-${key}`}
                          onClick={() => setGuesses((g) => ({ ...g, [key]: true }))}
                        >
                          Holds
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          data-testid={`guess-not-holds-${key}`}
                          onClick={() => setGuesses((g) => ({ ...g, [key]: false }))}
                        >
                          Doesn&apos;t hold
                        </button>
                      </div>
                    ) : (
                      <p
                        className={matched ? 'chip chip-inverse' : 'chip chip-ember'}
                        role="status"
                        data-testid={`guess-result-${key}`}
                      >
                        <span aria-hidden="true">{matched ? '✓' : '⚠'}</span>
                        <span>
                          {matched
                            ? `You agreed with the engine — it ${holds ? 'holds' : 'does not hold'}.`
                            : `The engine says it ${holds ? 'holds' : 'does not hold'}.`}
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center gap-8">
              <span className="text-body-sm text-graphite" data-testid="coffman-score">
                {answered.length === 0
                  ? 'No answers yet.'
                  : `You matched the engine on ${correct.length} of ${answered.length} answered.`}
              </span>
              {answered.length > 0 && (
                <button type="button" className="btn btn-ghost" onClick={() => setGuesses({})}>
                  Reset answers
                </button>
              )}
            </div>

            <p className="text-body-sm text-graphite">
              This checklist reflects your current scenario. Head to the{' '}
              <Link to="/lab" className="link">
                Lab
              </Link>{' '}
              to change it.
            </p>
          </div>
        )}

        {panel === 'RAG vs WFG' && (
          <div className="space-y-16 text-charcoal max-w-[75ch]">
            <p>
              The <span className="font-semibold text-ink-black">Resource Allocation Graph</span> is bipartite: process
              nodes and resource nodes, with request edges (P→R, dashed) and assignment edges (R→P, solid). Resource
              nodes show one dot per instance; filled dots are allocated.
            </p>
            <p>
              The <span className="font-semibold text-ink-black">Wait-For Graph</span> collapses resources away: there is
              an edge P_i → P_j when P_i is waiting for a resource held by P_j. For single-instance resources, the system
              is deadlocked exactly when the WFG has a cycle.
            </p>
            <p>
              When resources have several instances, a cycle in the RAG is necessary but not sufficient for deadlock, so
              we switch to the matrix algorithm.
            </p>
          </div>
        )}

        {panel === 'Detection' && (
          <div className="space-y-24 text-charcoal max-w-[80ch]">
            <div>
              <h3 className="font-semibold text-ink-black mb-8">Single-instance: WFG cycle detection</h3>
              <p className="mb-8">
                Convert the RAG to a Wait-For Graph and run a depth-first search. A back-edge to a node already on the
                current path is a cycle. The deadlocked set is the cycle plus every process that can reach it — those are
                permanently blocked too.
              </p>
              <Pseudocode lines={CYCLE_PSEUDOCODE} />
            </div>
            <div>
              <h3 className="font-semibold text-ink-black mb-8">Multi-instance: matrix algorithm</h3>
              <p className="mb-8">
                Work starts as Available. A process is marked finished when it holds nothing and waits for nothing; then
                we repeatedly pick any unfinished process whose request fits in Work, add its allocation back, and mark
                it finished. Whatever is still unfinished can never complete.
              </p>
              <Pseudocode lines={MATRIX_PSEUDOCODE} />
            </div>
          </div>
        )}

        {panel === 'Prevention vs Avoidance vs Recovery' && (
          <div className="space-y-24 text-charcoal max-w-[80ch]">
            <p>
              <span className="font-semibold text-ink-black">Prevention</span> removes one of the Coffman conditions up
              front, so deadlock becomes structurally impossible. <span className="font-semibold text-ink-black">Avoidance</span>{' '}
              (Banker&apos;s algorithm) allows all four conditions but refuses any request that would leave the system in
              an unsafe state. <span className="font-semibold text-ink-black">Recovery</span> lets deadlock happen and
              then breaks it by terminating processes or preempting resources.
            </p>
            <div>
              <h3 className="font-semibold text-ink-black mb-8">Banker&apos;s safety algorithm</h3>
              <Pseudocode lines={BANKER_SAFETY_PSEUDOCODE} />
            </div>
            <div>
              <h3 className="font-semibold text-ink-black mb-8">Recovery</h3>
              <Pseudocode lines={RECOVERY_PSEUDOCODE} />
            </div>
          </div>
        )}

        {panel === 'Complexity' && (
          <div className="space-y-16 text-charcoal max-w-[80ch]">
            <p>
              With at most 20 processes and 20 resources, every algorithm here returns in well under a millisecond.
              Detection is linear in the graph for single-instance systems and quadratic in the number of processes for
              the matrix algorithm.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-body-sm">
                <caption className="sr-only">Algorithm complexity table</caption>
                <thead>
                  <tr>
                    {['Algorithm', 'Time', 'Space', 'Note'].map((h) => (
                      <th key={h} scope="col" className="border border-fog px-8 py-4 text-left text-graphite">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPLEXITY.map((row) => (
                    <tr key={row.algorithm}>
                      <td className="border border-fog px-8 py-4 text-ink-black">{row.algorithm}</td>
                      <td className="border border-fog px-8 py-4 whitespace-nowrap">{row.time}</td>
                      <td className="border border-fog px-8 py-4 whitespace-nowrap">{row.space}</td>
                      <td className="border border-fog px-8 py-4 text-graphite">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Pseudocode({ lines }: { lines: string[] }) {
  return (
    <pre className="font-mono text-body-sm leading-relaxed overflow-x-auto border border-fog p-16 bg-off-white">
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          <span className="text-graphite select-none">{String(i + 1).padStart(2, ' ')} </span>
          {line}
        </div>
      ))}
    </pre>
  );
}
