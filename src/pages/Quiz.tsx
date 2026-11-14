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

const LETTERS = ['A', 'B', 'C', 'D'];

export function Quiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const question = QUESTIONS[index]!;
  const score = answers.filter(Boolean).length;

  useEffect(() => {
    setFocusedIndex(0);
  }, [index]);

  const selectOption = (i: number) => {
    if (isSubmitted) return;
    setSelected(i);
    setFocusedIndex(i);
  };

  const submitAnswer = () => {
    if (selected === null || isSubmitted) return;
    setIsSubmitted(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = selected === question.correct;
      return next;
    });
  };

  const nextQuestion = () => {
    if (!isSubmitted) return;
    if (index + 1 >= QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected(null);
    setIsSubmitted(false);
  };

  const retry = () => {
    setIndex(0);
    setSelected(null);
    setIsSubmitted(false);
    setAnswers([]);
    setFinished(false);
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
    } else if (e.key === ' ' || (e.key === 'Enter' && !isSubmitted && selected !== focusedIndex)) {
      if (!isSubmitted) {
        e.preventDefault();
        selectOption(focusedIndex);
      }
    }
  };

  if (finished) {
    const percent = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div className="w-full h-full overflow-hidden flex items-center justify-center bg-tint-bg p-16 select-none">
        <div className="w-full max-w-[620px] bg-white border border-line p-24 sm:p-28 shadow-none">
          <h1 className="font-poppins text-page-title text-ink font-semibold mb-12">Quiz complete</h1>
          <p className="font-mono text-[15px] text-ink mb-12" data-testid="quiz-score">
            You scored {score} / {QUESTIONS.length} ({percent}%)
          </p>
          <p className="font-mono text-body-mono text-muted mb-24">
            {percent === 100
              ? 'A perfect score — you understand operating systems deadlocks.'
              : percent >= 70
                ? 'Solid comprehension. Review the missed concepts in Learn and retry.'
                : 'Recommended to review the Learn section before attempting again.'}
          </p>
          <div className="pt-16 border-t border-line flex justify-end">
            <Button variant="primary" size="md" className="min-w-[104px]" onClick={retry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center bg-tint-bg p-12 sm:p-16 select-none">
      <div className="w-full max-w-[640px] bg-white border border-line p-20 sm:p-24 shadow-none">
        {/* Header row: Question X of 8 and Score */}
        <div className="flex items-center justify-between mb-6 font-mono text-[12px] text-muted">
          <span data-testid="quiz-progress" aria-live="polite">
            Question {index + 1} of {QUESTIONS.length}
          </span>
          <span data-testid="quiz-score-header">
            Score: <span className="text-ink font-medium">{score}</span> / {QUESTIONS.length}
          </span>
        </div>

        {/* 8-segment progress bar */}
        <div className="grid grid-cols-8 gap-4 h-[4px] mb-16 w-full" aria-hidden="true">
          {QUESTIONS.map((_, i) => {
            const isCompleted = i < index;
            const isCurrent = i === index;
            return (
              <div
                key={i}
                className={clsx(
                  'h-[4px] transition-colors',
                  (isCompleted || isCurrent) ? 'bg-navy' : 'bg-line'
                )}
              />
            );
          })}
        </div>

        {/* Question Prompt */}
        <h2
          id="quiz-question"
          className="font-poppins text-[18px] sm:text-[20px] font-semibold leading-[1.3] text-ink mb-16"
          data-testid="quiz-question"
        >
          {question.prompt}
        </h2>

        {/* Answer Options */}
        <ul
          className="space-y-8 mb-16"
          aria-labelledby="quiz-question"
          onKeyDown={handleKeyDown}
        >
          {question.options.map((option, i) => {
            const isSelected = i === selected;
            const isCorrect = i === question.correct;

            let borderClass = 'border-line';
            let bgClass = 'bg-white hover:bg-tint-bg';
            let textClass = 'text-ink';
            let letterBoxClass = 'bg-tint-bg text-ink';
            let statusLabel: string | null = null;
            let isMuted = false;

            if (isSubmitted) {
              if (isCorrect) {
                borderClass = 'border-success';
                bgClass = 'bg-success-tint';
                textClass = 'text-success font-medium';
                letterBoxClass = 'bg-success text-white';
                statusLabel = 'Correct';
              } else if (isSelected) {
                borderClass = 'border-danger';
                bgClass = 'bg-danger-tint';
                textClass = 'text-danger font-medium';
                letterBoxClass = 'bg-danger text-white';
                statusLabel = 'Incorrect';
              } else {
                isMuted = true;
                borderClass = 'border-line';
                bgClass = 'bg-white';
                textClass = 'text-muted';
                letterBoxClass = 'bg-tint-bg text-muted';
              }
            } else if (isSelected) {
              borderClass = 'border-navy';
              bgClass = 'bg-tint-bg';
              textClass = 'text-ink font-medium';
              letterBoxClass = 'bg-navy text-white';
            }

            return (
              <li key={i}>
                <button
                  ref={(el) => (optionRefs.current[i] = el)}
                  type="button"
                  tabIndex={0}
                  disabled={isSubmitted}
                  data-testid={`quiz-option-${i}`}
                  className={clsx(
                    'w-full min-h-[44px] px-14 py-8 border text-left font-mono text-[13px] transition-colors rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
                    borderClass,
                    bgClass,
                    textClass,
                    isMuted && 'opacity-40 cursor-default',
                    !isSubmitted && 'cursor-pointer',
                    'grid grid-cols-[24px_minmax(0,1fr)_auto] gap-10 items-center'
                  )}
                  onClick={() => selectOption(i)}
                  aria-label={`Option ${LETTERS[i]}: ${option}`}
                >
                  <span
                    className={clsx(
                      'w-[24px] h-[24px] flex items-center justify-center font-mono text-[12px] font-semibold shrink-0 select-none transition-colors',
                      letterBoxClass
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="leading-snug whitespace-normal">{option}</span>
                  {statusLabel && (
                    <span className="font-mono text-tiny-mono uppercase tracking-wider font-semibold ml-8 shrink-0">
                      {statusLabel}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer row: Explanation (left) and Submit / Next button (right) */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-12 min-h-[60px]">
          {/* Explanation placed below options and to the left of Next */}
          <div className="flex-1 min-w-0 min-h-[60px]" data-testid="quiz-feedback">
            {isSubmitted ? (
              <p
                className="font-mono text-small-mono text-muted leading-relaxed"
                data-testid="quiz-explanation"
              >
                {question.explanation}
              </p>
            ) : null}
          </div>

          {/* Submit / Next Action (identical UI and dimensions) */}
          <div className="shrink-0 flex justify-end">
            {!isSubmitted ? (
              <Button
                variant="primary"
                size="md"
                disabled={selected === null}
                onClick={submitAnswer}
                className="min-w-[104px]"
                data-testid="quiz-submit"
              >
                Submit
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={nextQuestion}
                className="min-w-[104px]"
                data-testid="quiz-next"
              >
                {index + 1 >= QUESTIONS.length ? 'Finish' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
