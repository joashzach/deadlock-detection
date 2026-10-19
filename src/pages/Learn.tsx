import { useMemo, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useLabStore } from '../store/useLabStore';
import { detectDeadlock } from '../engine/detect';
import { COMPLEXITY } from '../lib/complexity';
import { RagVsWfgDiagram } from '../components/LearnDiagrams';
import { Button } from '../components/ui/Button';

const TOPICS = [
  'What is a deadlock',
  'Four Coffman conditions',
  'RAG vs WFG',
  'Detection',
  'Prevention vs Avoidance vs Recovery',
  'Complexity',
] as const;

type TopicId = (typeof TOPICS)[number];

const CONDITION_KEYS = ['mutualExclusion', 'holdAndWait', 'noPreemption', 'circularWait'] as const;
type ConditionKey = (typeof CONDITION_KEYS)[number];

const CONDITION_LABELS: Record<ConditionKey, string> = {
  mutualExclusion: 'Mutual exclusion',
  holdAndWait: 'Hold and wait',
  noPreemption: 'No preemption',
  circularWait: 'Circular wait',
};

const slug = (topic: string) => topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function Learn() {
  const scenario = useLabStore((s) => s.scenario);
  const [topic, setTopic] = useState<TopicId>('What is a deadlock');
  const [guesses, setGuesses] = useState<Partial<Record<ConditionKey, boolean>>>({});
  const rightPaneRef = useRef<HTMLElement>(null);

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

  const handleSelectTopic = (t: TopicId) => {
    setTopic(t);
  };

  useEffect(() => {
    rightPaneRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [topic]);

  return (
    <div className="w-full h-[calc(100dvh-var(--nav-h))] max-h-[calc(100dvh-var(--nav-h))] flex flex-col md:flex-row bg-white overflow-hidden select-none">
      {/* Left Pane: fixed 280px on desktop (flush left, right border, padding 32 24 32 32); horizontal bar on mobile */}
      <nav
        className={clsx(
          // Desktop (>=768px): fixed 280px left pane
          'md:w-[280px] md:min-w-[280px] md:max-w-[280px] md:shrink-0 md:border-r md:border-line md:bg-white md:pt-[32px] md:pr-[24px] md:pb-[32px] md:pl-[32px] md:h-full md:overflow-y-auto',
          // Mobile (<768px): horizontal tab bar pinned under navbar
          'max-md:shrink-0 max-md:w-full max-md:flex max-md:items-center max-md:overflow-x-auto max-md:border-b max-md:border-line max-md:bg-white max-md:px-[16px] max-md:h-[48px] no-scrollbar z-10'
        )}
        aria-label="Theory topics"
        data-testid="learn-topic-nav"
      >
        <div className="hidden md:block text-label-caps mb-[24px] leading-tight">
          THEORY TOPICS
        </div>
        <div
          className="flex md:flex-col gap-[4px] max-md:h-full max-md:gap-[16px] max-md:items-center w-full"
          role="tablist"
        >
          {TOPICS.map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                id={`learn-tab-${slug(t)}`}
                aria-selected={active}
                aria-controls="learn-panel"
                className={clsx(
                  'text-left font-poppins text-[14px] font-medium transition-colors cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy',
                  'md:w-full md:min-h-[40px] md:flex md:items-center md:border-l-2 md:pl-[14px] md:py-[6px] md:leading-[1.3] md:whitespace-normal md:border-b-0',
                  'max-md:h-full max-md:px-[4px] max-md:flex max-md:items-center max-md:whitespace-nowrap max-md:border-b-2 max-md:border-l-0',
                  active
                    ? 'md:border-l-navy max-md:border-b-navy text-ink font-semibold'
                    : 'md:border-l-transparent max-md:border-b-transparent text-muted hover:text-ink'
                )}
                onClick={() => handleSelectTopic(t)}
              >
                {t}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right Scrollable Pane: ONLY scrollable area */}
      <main
        ref={rightPaneRef}
        className="flex-1 min-w-0 overflow-y-auto bg-white"
      >
        <div className="max-w-[720px] w-full pt-[32px] px-[24px] md:px-[48px] pb-[48px]">
          <article
            role="tabpanel"
            id="learn-panel"
            aria-labelledby={`learn-tab-${slug(topic)}`}
            tabIndex={-1}
          >
            {topic === 'What is a deadlock' && (
              <div>
                <h1 className="text-page-title mb-[16px]">
                  What is a deadlock
                </h1>
                <div className="space-y-[16px] text-body-mono max-w-[68ch]">
                  <p>
                    A deadlock is a condition in a concurrent system where a set of processes are blocked because every process is holding at least one resource and waiting for another resource acquired by some other process in the same set.
                  </p>
                  <p>
                    Because every blocked process requires an action from another blocked process in order to wake up, none can ever proceed. Without external intervention, the system remains frozen permanently.
                  </p>
                  <p>
                    Deadlock differs fundamentally from starvation and livelock. In starvation, a thread is delayed indefinitely due to scheduling bias while other threads make progress. In livelock, processes continually change internal states in response to each other without accomplishing forward work. In deadlock, processes are strictly motionless.
                  </p>
                </div>
              </div>
            )}

            {topic === 'Four Coffman conditions' && (
              <div>
                <h1 className="text-page-title mb-[16px]">
                  Four Coffman conditions
                </h1>
                <p className="text-body-mono mb-[32px]">
                  Edward G. Coffman Jr. established in 1971 that a deadlock can arise if and only if all four conditions hold simultaneously. Breaking any single condition mathematically prevents deadlock.
                </p>

                {!assessment || !assessable ? (
                  <div
                    className="p-[16px] border border-line bg-tint-bg font-mono text-[13px] text-muted"
                    data-testid="coffman-unassessable"
                  >
                    The current scenario has no process or no resource loaded. Load a scenario in the Lab to assess whether conditions hold.
                  </div>
                ) : (
                  <div className="space-y-[32px]" data-testid="coffman-checklist">
                    <div className="flex items-center justify-between border-b border-line pb-[12px] font-mono text-[13px]">
                      <span className="text-ink font-semibold">Interactive Checklist</span>
                      <span className="text-muted" data-testid="coffman-score">
                        {answered.length === 0 ? 'No answers yet' : `${correct.length} of ${answered.length} correct`}
                      </span>
                    </div>

                    <div className="space-y-[24px]">
                      {CONDITION_KEYS.map((key) => {
                        const label = CONDITION_LABELS[key];
                        const engineHolds = assessment[key];
                        const userGuess = guesses[key];
                        const isAnswered = userGuess !== undefined;
                        const isCorrect = userGuess === engineHolds;

                        return (
                          <div key={key} className="border border-line p-[20px] bg-white">
                            <div className="flex items-baseline justify-between mb-[8px]">
                              <span className="text-panel-heading">
                                {label}
                              </span>
                              <span className="font-mono text-[13px] text-muted">
                                engine: {engineHolds ? 'holds' : 'does not hold'}
                              </span>
                            </div>
                            <p className="text-body-mono mb-[16px]">
                              {assessment.reasons[key]}
                            </p>

                            <div className="flex gap-[8px] mb-[12px]">
                              <Button
                                variant={userGuess === true ? 'primary' : 'secondary'}
                                className="flex-1"
                                onClick={() => setGuesses((g) => ({ ...g, [key]: true }))}
                                data-testid={`guess-holds-${key}`}
                              >
                                Holds
                              </Button>
                              <Button
                                variant={userGuess === false ? 'primary' : 'secondary'}
                                className="flex-1"
                                onClick={() => setGuesses((g) => ({ ...g, [key]: false }))}
                                data-testid={`guess-not-holds-${key}`}
                              >
                                Does not hold
                              </Button>
                            </div>

                            {isAnswered && (
                              <div
                                className="font-mono text-[13px] mt-[8px]"
                                data-testid={`guess-result-${key}`}
                              >
                                {isCorrect ? (
                                  <span className="text-success font-medium">✓ Correct: agreed with the engine.</span>
                                ) : (
                                  <span className="text-danger font-medium">
                                    ✕ The engine says this condition {engineHolds ? 'holds' : 'does not hold'}.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => setGuesses({})}
                    >
                      Reset answers
                    </Button>
                  </div>
                )}
              </div>
            )}

            {topic === 'RAG vs WFG' && (
              <div>
                <h1 className="text-page-title mb-[16px]">
                  RAG vs WFG
                </h1>
                <div className="space-y-[16px] text-body-mono mb-[24px] max-w-[68ch]">
                  <p>
                    A <strong>Resource Allocation Graph (RAG)</strong> is a directed bipartite graph containing two node sets: Processes (circles) and Resources (squares). Edges represent assignments (Resource → Process) and requests (Process → Resource).
                  </p>
                  <p>
                    A <strong>Wait-For Graph (WFG)</strong> is a directed graph containing only process nodes. An edge P<sub>i</sub> → P<sub>j</sub> exists if P<sub>i</sub> is requesting a resource currently held by P<sub>j</sub>. The WFG is obtained by collapsing resource nodes out of a single-instance RAG.
                  </p>
                </div>
                <div className="border border-line p-[24px] bg-white max-w-[68ch]">
                  <RagVsWfgDiagram scenario={scenario} />
                </div>
              </div>
            )}

            {topic === 'Detection' && (
              <div>
                <h1 className="text-page-title mb-[16px]">
                  Detection Algorithms
                </h1>
                <div className="space-y-[16px] text-body-mono max-w-[68ch]">
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
                <h1 className="text-page-title mb-[16px]">
                  Prevention, Avoidance, and Recovery
                </h1>
                <div className="space-y-[16px] text-body-mono max-w-[68ch]">
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
                <h1 className="text-page-title mb-[16px]">
                  Algorithm Complexity
                </h1>
                <div className="w-full border border-line overflow-hidden">
                  <table
                    className="w-full font-mono text-[14px] text-left border-collapse table-fixed"
                    aria-label="Algorithm complexity table"
                  >
                    <thead>
                      <tr className="border-b border-line bg-tint-bg text-muted h-[40px]">
                        <th className="px-[16px] py-[10px] font-medium whitespace-nowrap w-[210px]">Algorithm</th>
                        <th className="px-[16px] py-[10px] font-medium whitespace-nowrap w-[110px]">Time</th>
                        <th className="px-[16px] py-[10px] font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white text-ink">
                      {COMPLEXITY.map((row) => (
                        <tr key={row.algorithm} className="h-[44px] max-h-[44px]">
                          <td className="px-[16px] py-[10px] font-semibold whitespace-nowrap truncate">{row.algorithm}</td>
                          <td className="px-[16px] py-[10px] text-muted whitespace-nowrap">{row.time}</td>
                          <td className="px-[16px] py-[10px] text-muted text-[13px] max-[480px]:text-[12px] truncate">{row.note}</td>
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
