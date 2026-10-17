import { useState } from 'react';

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
    id: "q4",
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
  {
    id: 'q9',
    prompt: "In Banker's algorithm, a request that exceeds the process's declared Need is…",
    options: ['Granted', 'Denied (unsafe)', 'Must wait', 'An error'],
    correct: 3,
    explanation:
      'A process may never claim more than its declared maximum, so such a request is an error rather than a normal denial.',
  },
  {
    id: 'q10',
    prompt: 'A deadlock-detection algorithm reports an unsafe state. Does that mean a deadlock currently exists?',
    options: [
      'Yes, unsafe and deadlocked are the same thing',
      'No, unsafe means deadlock may occur later if requests are granted carelessly',
      'Yes, but only with multiple instances',
      'Only if a cycle also exists',
    ],
    correct: 1,
    explanation:
      'Unsafe is a statement about the future: there exists some sequence of future requests that could lead to deadlock. An unsafe state is not itself a deadlock.',
  },
];

export function Quiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[index]!;
  const answered = selected !== null;
  const score = answers.filter(Boolean).length;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = i === question.correct;
      return next;
    });
  };

  const next = () => {
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
      <div className="max-w-page mx-auto px-16 py-56">
        <h1 className="section-heading text-heading-sm mb-16">Quiz complete</h1>
        <p className="text-subheading text-ink-black mb-8" data-testid="quiz-score">
          You scored {score} / {QUESTIONS.length} ({percent}%)
        </p>
        <p className="text-charcoal mb-24 max-w-[60ch]">
          {percent === 100
            ? 'A perfect score — you know your deadlocks.'
            : percent >= 70
              ? 'Solid work. Review the ones you missed and try again.'
              : 'Worth another pass through the Learn section before retrying.'}
        </p>
        <button type="button" className="btn btn-ember" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-16 py-40">
      <header className="mb-24">
        <h1 className="section-heading text-heading-sm mb-8">Quiz</h1>
        <p className="text-graphite" data-testid="quiz-progress">
          Question {index + 1} of {QUESTIONS.length} · Score {score}
        </p>
      </header>

      <div className="panel p-24">
        <h2 className="font-semibold text-ink-black mb-16" data-testid="quiz-question">
          {question.prompt}
        </h2>
        <ul className="space-y-8">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correct;
            const isChosen = i === selected;
            let cls = 'btn btn-outline w-full justify-start text-left';
            if (answered && isCorrect) cls = 'btn btn-inverse w-full justify-start text-left';
            else if (answered) cls = 'btn btn-outline w-full justify-start text-left opacity-60';
            return (
              <li key={i}>
                <button
                  type="button"
                  className={cls}
                  onClick={() => choose(i)}
                  disabled={answered}
                  data-testid={`quiz-option-${i}`}
                  aria-pressed={isChosen}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              </li>
            );
          })}
        </ul>

        {answered && (
          <div
            className={selected === question.correct ? 'chip chip-inverse mt-16' : 'chip chip-ember mt-16'}
            role="status"
            data-testid="quiz-feedback"
          >
            <span aria-hidden="true">{selected === question.correct ? '✓' : '⚠'}</span>
            <span>
              {selected === question.correct ? 'Correct. ' : 'Not quite. '}
              {question.explanation}
            </span>
          </div>
        )}

        <div className="mt-24">
          <button type="button" className="btn btn-ember" onClick={next} disabled={!answered}>
            {index + 1 >= QUESTIONS.length ? 'See results' : 'Next question'}
          </button>
        </div>
      </div>
    </div>
  );
}
