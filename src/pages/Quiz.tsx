import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    prompt: 'How many Coffman conditions must hold at the same time for a deadlock to be possible?',
    options: ['One', 'Two', 'Three', 'All four'],
    correct: 3,
    explanation:
      'All four — mutual exclusion, hold and wait, no preemption, and circular wait — must hold simultaneously. Breaking any single one prevents deadlock.',
  },
  {
    id: 'q2',
    prompt: 'In a system where every resource has exactly one instance, the system is deadlocked if and only if…',
    options: [
      'Available equals zero',
      'The Resource Allocation Graph contains a cycle',
      'Some process is waiting',
      'The Wait-For Graph is acyclic',
    ],
    correct: 1,
    explanation:
      'For single-instance resources, a cycle in the RAG (equivalently in the Wait-For Graph) is both necessary and sufficient for deadlock.',
  },
  {
    id: 'q3',
    prompt: 'When resources have multiple instances, a cycle in the Resource Allocation Graph means…',
    options: [
      'The system is definitely deadlocked',
      'The system is definitely safe',
      'Deadlock is possible but not certain',
      'The matrix algorithm cannot be used',
    ],
    correct: 2,
    explanation:
      'With multiple instances a cycle is necessary for deadlock but not sufficient — another process may hold enough instances to break it. Use the matrix algorithm to be sure.',
  },
  {
    id: 'q4',
    prompt: "Banker's algorithm is an example of which strategy?",
    options: ['Deadlock detection', 'Deadlock prevention', 'Deadlock avoidance', 'Deadlock recovery'],
    correct: 2,
    explanation:
      "Banker's algorithm avoids deadlock by refusing requests that would leave the system in an unsafe state; it does not remove the Coffman conditions.",
  },
  {
    id: 'q5',
    prompt: 'Imposing a global ordering on resources (always request R0 before R1 before R2…) breaks which condition?',
    options: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait'],
    correct: 3,
    explanation:
      'If all processes request resources in ascending index order, no cycle of waiting can form, so circular wait is impossible.',
  },
  {
    id: 'q6',
    prompt: 'In the multi-instance detection algorithm, what is Work initialised to?',
    options: ['All zeros', 'The Available vector', 'The Max matrix', 'The sum of all allocations'],
    correct: 1,
    explanation:
      'Work starts as a copy of Available, then grows by Allocation[i] as each process is found able to finish.',
  },
  {
    id: 'q7',
    prompt: 'A process holds no resources but has an outstanding request. Can it be part of the deadlocked set?',
    options: [
      'No, a process holding nothing can always finish',
      'Yes, if its request can never be satisfied because the holder is deadlocked',
      'Only if it is on the cycle itself',
      'Only in single-instance systems',
    ],
    correct: 1,
    explanation:
      'A process with no allocation that is waiting on a resource held by a deadlocked process can never finish either, so it is permanently blocked and belongs to the deadlocked set (though not to the cycle members).',
  },
  {
    id: 'q8',
    prompt: "In Banker's resource-request algorithm, a request larger than what is currently Available results in…",
    options: ['Granted', 'Denied (unsafe)', 'Must wait', 'Error (exceeds need)'],
    correct: 2,
    explanation:
      'If Request ≤ Need but Request > Available, the process must wait: the resources simply are not there yet. Denial for unsafety only applies after a provisional allocation fails the safety check.',
  },
];

export function Quiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const question = QUESTIONS[index]!;
  const answered = selected !== null;
  const score = answers.filter(Boolean).length;

  useEffect(() => {
    setFocusedIndex(0);
  }, [index]);

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = i === question.correct;
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (focusedIndex + 1) % question.options.length;
      setFocusedIndex(nextIdx);
      optionRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (focusedIndex - 1 + question.options.length) % question.options.length;
      setFocusedIndex(prevIdx);
      optionRefs.current[prevIdx]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!answered) {
        e.preventDefault();
        choose(focusedIndex);
      }
    }
  };

  const next = () => {
    if (!answered) return;
    if (index + 1 >= QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
  };

  const retry = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const percent = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div className="w-full min-h-[calc(100dvh-var(--nav-h))] flex items-center justify-center bg-tint-bg p-[16px] md:p-[24px] select-none">
        <div className="w-full max-w-[680px] bg-white border border-line p-[24px] md:p-[32px] flex flex-col justify-between min-h-[580px] shadow-none">
          <div>
            <h1 className="text-page-title mb-[16px]">Quiz complete</h1>
            <p className="font-mono text-[18px] text-ink mb-[16px]" data-testid="quiz-score">
              You scored {score} / {QUESTIONS.length} ({percent}%)
            </p>
            <p className="text-body-mono mb-[32px]">
              {percent === 100
                ? 'A perfect score — you understand operating systems deadlocks.'
                : percent >= 70
                  ? 'Solid comprehension. Review the missed concepts in Learn and retry.'
                  : 'Recommended to review the Learn section before attempting again.'}
            </p>
          </div>
          <div className="pt-[16px] border-t border-line flex justify-end">
            <Button variant="primary" className="min-w-[100px]" onClick={retry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100dvh-var(--nav-h))] flex items-center justify-center bg-tint-bg p-[16px] md:p-[24px] select-none">
      <div className="w-full max-w-[680px] bg-white border border-line p-[24px] md:p-[32px] flex flex-col justify-between min-h-[660px] shadow-none">
        <div>
          {/* Header row: Question X of 8 left, Score Y right */}
          <div className="flex items-center justify-between mb-[12px] font-mono text-[13px] text-ink">
            <span data-testid="quiz-progress" aria-live="polite">
              Question {index + 1} of {QUESTIONS.length}
            </span>
            <span className="text-muted" data-testid="quiz-score-header">
              Score {score}
            </span>
          </div>

          {/* Thin progress bar: 8 equal segments (4px high, 4px gaps) */}
          <div className="grid grid-cols-8 gap-[4px] h-[4px] mb-[20px] w-full" aria-hidden="true">
            {QUESTIONS.map((_, i) => {
              let segClass = 'bg-line';
              if (i < index) {
                segClass = 'bg-navy';
              } else if (i === index) {
                segClass = 'border border-navy bg-white';
              }
              return <div key={i} className={clsx('h-[4px]', segClass)} />;
            })}
          </div>

          {/* Question: Poppins 22/1.35/600, 16px below */}
          <h2
            id="quiz-question"
            className="font-poppins text-[22px] font-semibold leading-[1.35] text-ink mb-[20px]"
            data-testid="quiz-question"
          >
            {question.prompt}
          </h2>

          {/* Option rows: full width, min-height 52px, 1px border, padding 12px 16px, grid [28px letter box | text], 8px between rows */}
          <ul
            className="space-y-[8px]"
            aria-labelledby="quiz-question"
            onKeyDown={handleKeyDown}
          >
            {question.options.map((option, i) => {
              const isSelected = i === selected;
              const isCorrect = i === question.correct;
              let borderClass = 'border-line';
              let bgClass = 'bg-white hover:bg-tint-bg';
              let textClass = 'text-ink';
              let letterBoxBg = 'bg-tint-bg text-ink border-line';

              if (answered) {
                if (isCorrect) {
                  borderClass = 'border-success';
                  bgClass = 'bg-success-tint';
                  textClass = 'text-success font-semibold';
                  letterBoxBg = 'bg-success text-white border-success';
                } else if (isSelected) {
                  borderClass = 'border-danger';
                  bgClass = 'bg-danger-tint';
                  textClass = 'text-danger';
                  letterBoxBg = 'bg-danger text-white border-danger';
                } else {
                  borderClass = 'border-line';
                  bgClass = 'bg-white opacity-40';
                  textClass = 'text-muted';
                }
              } else if (isSelected) {
                borderClass = 'border-navy';
                bgClass = 'bg-tint-bg';
                textClass = 'text-navy font-semibold';
                letterBoxBg = 'bg-navy text-white border-navy';
              }

              return (
                <li key={i}>
                  <button
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    type="button"
                    className={clsx(
                      'w-full min-h-[52px] text-left px-[16px] py-[12px] border transition-colors grid grid-cols-[28px_1fr] items-center gap-[12px] font-mono text-[14px] cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy',
                      borderClass,
                      bgClass,
                      textClass
                    )}
                    onClick={() => choose(i)}
                    disabled={answered}
                    data-testid={`quiz-option-${i}`}
                    aria-pressed={isSelected}
                    tabIndex={0}
                  >
                    <span
                      className={clsx(
                        'w-[28px] h-[28px] border flex items-center justify-center font-mono text-[12px] font-semibold select-none shrink-0',
                        letterBoxBg
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex items-center justify-between gap-[8px] min-w-0">
                      <span className="leading-tight">{option}</span>
                      {answered && isCorrect && (
                        <span className="font-mono text-[12px] text-success font-semibold shrink-0">
                          ✓ Correct
                        </span>
                      )}
                      {answered && isSelected && !isCorrect && (
                        <span className="font-mono text-[12px] text-danger font-semibold shrink-0">
                          ✕ Incorrect
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Feedback area with RESERVED fixed min-height so selecting an option never moves anything */}
        <div className="min-h-[120px] my-[16px] flex flex-col justify-center">
          {answered && (
            <div
              className="p-[12px] md:p-[14px] border border-line bg-tint-bg font-mono text-[13px] leading-[1.6]"
              role="status"
              data-testid="quiz-feedback"
            >
              <div className="font-semibold mb-[2px] text-ink">
                {selected === question.correct ? '✓ Correct.' : '✕ Incorrect.'}
              </div>
              <p className="text-muted">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer row: hint on left, Next button on right (always visible, disabled 40% opacity until answered) */}
        <div className="flex items-center justify-between pt-[16px] border-t border-line">
          <span className="font-mono text-[13px] text-muted">
            {answered ? '' : 'Select an answer to continue'}
          </span>
          <Button
            variant="primary"
            className="min-w-[100px] h-[40px]"
            disabled={!answered}
            onClick={next}
            data-testid="quiz-next"
          >
            {index + 1 >= QUESTIONS.length ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
