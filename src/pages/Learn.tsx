import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useLabStore } from '../store/useLabStore';
import { COMPLEXITY } from '../lib/complexity';
import { RagVsWfgDiagram } from '../components/LearnDiagrams';

const TOPICS = [
  'What is a deadlock',
  'Four Coffman conditions',
  'RAG vs WFG',
  'Detection',
  'Prevention vs Avoidance vs Recovery',
  'Complexity',
] as const;

type TopicId = (typeof TOPICS)[number];

const COFFMAN_CONDITIONS = [
  {
    key: 'mutualExclusion',
    title: 'Mutual exclusion',
    description:
      'Some resources can be used by only one process at a time. If a process is using such a resource, other processes must wait until it becomes available. This condition matters when resources cannot be safely shared between processes.',
  },
  {
    key: 'holdAndWait',
    title: 'Hold and wait',
    description:
      'A process holds at least one resource while waiting to acquire another resource held by a different process. For example, a process might hold a printer while waiting for a scanner. This can contribute to deadlock when processes continue waiting for resources held by one another.',
  },
  {
    key: 'noPreemption',
    title: 'No preemption',
    description:
      'Resources cannot be forcibly taken away from a process; the process must release them voluntarily after use. If a process holds a resource and waits indefinitely for another, the operating system cannot simply reclaim the resource under this condition. This can allow deadlock to persist.',
  },
  {
    key: 'circularWait',
    title: 'Circular wait',
    description:
      'A cycle of processes exists in which each process waits for a resource held by the next process in the cycle. For example, Process A waits for a resource held by B, while B waits for one held by A. This circular dependency can prevent every process in the cycle from making progress.',
  },
] as const;

const slug = (topic: string) => topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function Learn() {
  const scenario = useLabStore((s) => s.scenario);
  const [topic, setTopic] = useState<TopicId>('What is a deadlock');
  const rightPaneRef = useRef<HTMLElement>(null);

  const handleSelectTopic = (t: TopicId) => {
    setTopic(t);
  };

  useEffect(() => {
    if (typeof rightPaneRef.current?.scrollTo === 'function') {
      rightPaneRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [topic]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-white overflow-hidden select-none">
      {/* Left Pane: minimal, non-scrollable educational sidebar with clean numbering */}
      <nav
        className={clsx(
          // Desktop (>=768px): fixed 240px to 260px, non-scrollable, minimal layout
          'hidden md:flex md:flex-col md:w-[240px] lg:w-[260px] md:min-w-[240px] lg:min-w-[260px] md:shrink-0 md:border-r md:border-line md:bg-white md:py-10 md:px-0 md:h-full md:overflow-hidden select-none',
          // Mobile (<768px): horizontal tab bar pinned under navbar
          'max-md:shrink-0 max-md:w-full max-md:flex max-md:items-center max-md:overflow-x-auto max-md:border-b max-md:border-line max-md:bg-white max-md:px-10 max-md:h-[42px] no-scrollbar z-10'
        )}
        aria-label="Theory topics"
        data-testid="learn-topic-nav"
      >
        <div className="hidden md:flex items-center px-14 pt-4 pb-8">
          <span className="font-poppins text-label uppercase text-muted tracking-wider">
            TOPICS
          </span>
        </div>
        <div
          className="flex md:flex-col gap-1 max-md:h-full max-md:gap-6 max-md:items-center w-full"
          role="tablist"
        >
          {TOPICS.map((t, idx) => {
            const active = topic === t;
            const num = String(idx + 1).padStart(2, '0');
            return (
              <button
                key={t}
                type="button"
                role="tab"
                id={`learn-tab-${slug(t)}`}
                aria-selected={active}
                aria-controls="learn-panel"
                className={clsx(
                  'text-left font-poppins transition-colors cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy group',
                  // Desktop: compact vertical padding and tight gap so all 6 modules are easily visible without scrolling
                  'md:w-full md:flex md:items-center md:gap-10 md:px-14 md:py-6 md:border-l-2 md:border-b-0',
                  // Mobile
                  'max-md:h-full max-md:px-10 max-md:flex max-md:items-center max-md:gap-6 max-md:whitespace-nowrap max-md:border-b-2 max-md:border-l-0 max-md:shrink-0',
                  active
                    ? 'md:border-l-navy md:bg-tint-bg max-md:border-b-navy text-ink font-medium'
                    : 'md:border-l-transparent md:hover:bg-tint-bg/50 max-md:border-b-transparent text-muted hover:text-ink'
                )}
                onClick={() => handleSelectTopic(t)}
              >
                <span
                  className={clsx(
                    'font-mono text-[11px] tabular-nums shrink-0 select-none transition-colors',
                    active ? 'text-navy font-semibold' : 'text-muted'
                  )}
                  aria-hidden="true"
                >
                  {num}
                </span>
                <span className="text-[13px] leading-snug whitespace-normal break-words">
                  {t}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right Scrollable Pane: ONLY scrollable area */}
      <main
        ref={rightPaneRef}
        className="flex-1 min-w-0 h-full overflow-y-auto bg-white"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className={clsx(
          'w-full pt-32 px-24 md:px-48 pb-48',
          topic === 'Complexity' || topic === 'RAG vs WFG' ? 'max-w-[880px]' : 'max-w-[760px]'
        )}>
          <article
            role="tabpanel"
            id="learn-panel"
            aria-labelledby={`learn-tab-${slug(topic)}`}
            tabIndex={-1}
          >
            {topic === 'What is a deadlock' && (
              <div>
                <h1 className="font-poppins text-page-title text-ink font-semibold mb-16">
                  What is a deadlock
                </h1>
                <div className="space-y-16 font-mono text-body-mono text-muted max-w-[68ch]">
                  <p>
                    A <strong>deadlock</strong> is a permanent stall in an operating system where a set of processes cannot proceed because each process holds at least one resource and is waiting for another resource held by another process in the same set.
                  </p>
                  <p>
                    Deadlocks cannot resolve on their own. Once a deadlock cycle forms, the involved processes will remain blocked indefinitely unless the operating system intervenes by preempting resources or terminating processes.
                  </p>
                  <p>
                    DeadlockLab provides interactive simulations of the classical algorithms developed by Edsger Dijkstra and other operating system pioneers to detect, prevent, avoid, and recover from deadlocks.
                  </p>
                </div>
              </div>
            )}

            {topic === 'Four Coffman conditions' && (
              <div>
                <h1 className="font-poppins text-page-title text-ink font-semibold mb-16">
                  Four Coffman conditions
                </h1>
                <p className="font-mono text-body-mono text-muted mb-24 max-w-[68ch]">
                  In 1971, Edward G. Coffman Jr. proved that a deadlock can arise if and only if all four of the following conditions hold simultaneously:
                </p>

                <div className="space-y-12 max-w-[68ch]">
                  {COFFMAN_CONDITIONS.map((cond) => (
                    <div
                      key={cond.key}
                      className="border border-line p-16 bg-white"
                    >
                      <h2 className="font-poppins text-[15px] font-semibold text-ink mb-8">
                        {cond.title}
                      </h2>
                      <p className="font-mono text-small-mono text-muted leading-relaxed">
                        {cond.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topic === 'RAG vs WFG' && (
              <div>
                <h1 className="font-poppins text-page-title text-ink font-semibold mb-16">
                  Resource Allocation Graph vs Wait-For Graph
                </h1>
                <div className="space-y-16 font-mono text-body-mono text-muted max-w-[68ch] mb-24">
                  <p>
                    A <strong>Resource Allocation Graph (RAG)</strong> is a bipartite directed graph consisting of Process nodes (circles) and Resource nodes (boxes). Edges represent resource state:
                  </p>
                  <ul className="list-disc list-inside space-y-4">
                    <li><strong>Request edge (P → R):</strong> Process P is waiting for resource R.</li>
                    <li><strong>Assignment edge (R → P):</strong> Resource R is currently allocated to process P.</li>
                  </ul>
                  <p>
                    A <strong>Wait-For Graph (WFG)</strong> is a directed graph containing only process nodes. An edge P<sub>i</sub> → P<sub>j</sub> exists if P<sub>i</sub> is requesting a resource currently held by P<sub>j</sub>. The WFG is obtained by collapsing resource nodes out of a single-instance RAG.
                  </p>
                </div>
                <div className="w-full">
                  <RagVsWfgDiagram scenario={scenario} />
                </div>
              </div>
            )}

            {topic === 'Detection' && (
              <div>
                <h1 className="font-poppins text-page-title text-ink font-semibold mb-16">
                  Detection Algorithms
                </h1>
                <div className="space-y-16 font-mono text-body-mono text-muted max-w-[68ch]">
                  <p>
                    <strong>Single-Instance Resources:</strong> In systems where every resource class contains exactly one instance, a cycle in the Wait-For Graph is both necessary and sufficient for a deadlock. Tarjan&apos;s Strongly Connected Components (SCC) or DFS cycle detection identifies all cycle members in O(V + E) time.
                  </p>
                  <p>
                    <strong>Multi-Instance Resources:</strong> When resources have multiple identical units, a cycle is necessary but not sufficient. A cycle may exist while another process holds enough units to satisfy one of the cyclic processes and break the cycle. Detection requires a matrix reduction algorithm using Allocation, Request, Available, and a Finish boolean vector in O(m · n²) time.
                  </p>
                </div>
              </div>
            )}

            {topic === 'Prevention vs Avoidance vs Recovery' && (
              <div>
                <h1 className="font-poppins text-page-title text-ink font-semibold mb-16">
                  Prevention, Avoidance, and Recovery
                </h1>
                <div className="space-y-16 font-mono text-body-mono text-muted max-w-[68ch]">
                  <p>
                    <strong>Deadlock Prevention:</strong> Design the system protocol such that at least one of the four Coffman conditions can never hold. Examples include total resource ordering (eliminates circular wait) and atomic all-at-once allocation (eliminates hold and wait).
                  </p>
                  <p>
                    <strong>Deadlock Avoidance:</strong> Allow the Coffman conditions to hold in theory, but track dynamic resource states and future claims (Max demand). With Dijkstra&apos;s Banker&apos;s Algorithm, every request is tested provisionally. If granting it results in an unsafe state where no safe sequence exists, the request is delayed.
                  </p>
                  <p>
                    <strong>Deadlock Recovery:</strong> Detect deadlocks after they occur, then resolve them by terminating deadlocked processes (one by one or all at once) or preempting resources with rollback to a safe checkpoint.
                  </p>
                </div>
              </div>
            )}

            {topic === 'Complexity' && (
              <div>
                <h1 className="font-poppins text-page-title text-ink font-semibold mb-8">
                  Algorithm Complexity
                </h1>
                <p className="font-mono text-body-mono text-muted mb-16 max-w-[72ch]">
                  Asymptotic time and space complexity for all deadlock detection, prevention, and recovery routines.
                </p>
                <div className="w-full border border-line bg-white overflow-x-auto shadow-sm">
                  <table
                    className="w-full font-mono text-[11px] text-left border-collapse"
                    aria-label="Algorithm complexity table"
                  >
                    <thead>
                      <tr className="border-b border-line bg-tint-bg text-muted h-[30px]">
                        <th className="px-10 py-3 font-medium whitespace-nowrap text-ink">Algorithm</th>
                        <th className="px-10 py-3 font-medium whitespace-nowrap text-ink">Time</th>
                        <th className="px-10 py-3 font-medium whitespace-nowrap text-ink">Space</th>
                        <th className="px-10 py-3 font-medium text-ink">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-ink">
                      {COMPLEXITY.map((row) => (
                        <tr key={row.algorithm} className="h-[30px] hover:bg-tint-bg/40 transition-colors">
                          <td className="px-10 py-3 font-normal whitespace-nowrap text-navy">{row.algorithm}</td>
                          <td className="px-10 py-3 font-normal whitespace-nowrap text-ink">{row.time}</td>
                          <td className="px-10 py-3 text-muted whitespace-nowrap">{row.space}</td>
                          <td className="px-10 py-3 text-muted leading-snug">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
