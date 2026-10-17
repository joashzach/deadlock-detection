import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLabStore } from '../store/useLabStore';
import { detectDeadlock } from '../engine/detect';
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

export function Learn() {
  const scenario = useLabStore((s) => s.scenario);
  const [panel, setPanel] = useState<PanelId>('What is a deadlock');

  const assessment = useMemo(() => {
    try {
      return detectDeadlock(scenario).result.coffmanStatus;
    } catch {
      return null;
    }
  }, [scenario]);

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
            aria-selected={panel === p}
            className={panel === p ? 'chip chip-inverse' : 'chip'}
            onClick={() => setPanel(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <section className="panel p-24" role="tabpanel">
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
              prevents deadlock entirely.
            </p>
            <ul className="space-y-12">
              {CONDITION_KEYS.map((key) => {
                const holds = assessment?.[key] ?? false;
                const reason = assessment?.reasons[key] ?? 'Run detection in the Lab to assess this condition.';
                return (
                  <li key={key} className="flex items-start gap-12">
                    <span
                      className={holds ? 'chip chip-inverse' : 'chip'}
                      aria-label={holds ? 'condition currently holds' : 'condition does not currently hold'}
                    >
                      {holds ? '●' : '○'}
                    </span>
                    <div>
                      <p className="font-semibold text-ink-black">
                        {key === 'mutualExclusion' && 'Mutual exclusion'}
                        {key === 'holdAndWait' && 'Hold and wait'}
                        {key === 'noPreemption' && 'No preemption'}
                        {key === 'circularWait' && 'Circular wait'}
                      </p>
                      <p className="text-body-sm text-graphite">{reason}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
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
          <div className="text-charcoal max-w-[75ch]">
            <p className="mb-16">
              Detection cost is linear in the graph for single-instance systems and quadratic in the number of processes
              for the matrix algorithm. Since n ≤ 20 here, every algorithm returns in well under a millisecond.
            </p>
            <p className="text-body-sm text-graphite">
              See the About page for the full complexity table.
            </p>
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
