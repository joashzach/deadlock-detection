export function About() {
  const topics = [
    'Wait-For Graph cycle detection',
    'Multi-instance matrix detection',
    "Banker's safety and request algorithms",
    'Coffman-condition prevention policies',
    'Recovery by termination or preemption',
  ];

  return (
    <div className="w-full bg-white flex-1 min-h-0 overflow-y-auto select-none">
      <div className="max-w-[720px] w-full mx-auto pt-[32px] px-[24px] md:px-[48px] pb-[64px]">
        <h1 className="text-page-title mb-[32px]">
          About DeadLockLab
        </h1>

        <div className="space-y-[32px]">
          {/* Section 1: What it is */}
          <section>
            <h2 className="text-section-heading mb-[12px]">
              What it is
            </h2>
            <p className="text-body-mono">
              DeadLockLab is an educational lab for exploring resource allocation graphs, concurrency and deadlock dynamics in operating systems.
            </p>
          </section>

          {/* Section 2: What it covers */}
          <section>
            <h2 className="text-section-heading mb-[12px]">
              What it covers
            </h2>
            <ul className="border-t border-b border-line divide-y divide-line text-body-mono">
              {topics.map((t) => (
                <li key={t} className="py-[10px] text-ink font-mono text-[15px]">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: How it's built */}
          <section>
            <h2 className="text-section-heading mb-[12px]">
              How it's built
            </h2>
            <p className="text-body-mono">
              Built with React, TypeScript and Vite. Runs entirely in your browser with no backend server and no tracking.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

