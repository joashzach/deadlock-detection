export function About() {
  return (
    <div
      className="w-full h-full bg-white flex-1 min-h-0 overflow-y-auto select-none"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="max-w-[720px] w-full mx-auto pt-32 px-24 md:px-48 pb-48">
        <header className="mb-32">
          <h1 className="font-poppins text-page-title text-ink font-semibold mb-8">
            About DeadLockLab
          </h1>
          <p className="font-mono text-[14px] text-muted leading-relaxed">
            An open educational platform for visual exploration and algorithmic analysis of concurrency deadlocks in operating systems.
          </p>
        </header>

        <div className="space-y-32">
          {/* Section 1: Purpose & Mission */}
          <section>
            <h2 className="font-poppins text-section-heading text-ink font-semibold mb-12">
              Purpose & Mission
            </h2>
            <p className="font-mono text-[14px] leading-[1.7] text-muted">
              DeadLockLab bridges theoretical operating systems concepts and visual intuition. Concurrency bugs and deadlocks are notoriously difficult to conceptualize from static textbooks alone. By dynamically modeling resource allocation systems, learners can experiment with edge-case scenarios, observe state transitions, and verify deadlock detection, safety checks, and prevention policies in real time.
            </p>
          </section>

          {/* Section 2: Pedagogical Design */}
          <section>
            <h2 className="font-poppins text-section-heading text-ink font-semibold mb-12">
              Pedagogical Value
            </h2>
            <div className="space-y-0">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-4 sm:gap-16 items-baseline py-16 border-t border-line">
                <span className="font-poppins text-[15px] leading-[1.4] font-semibold text-ink">
                  Deterministic Engine
                </span>
                <span className="font-mono text-[14px] leading-[1.7] text-muted">
                  Every algorithm executes against an immutable state model, allowing students to inspect mathematical invariants, safe execution sequences, and cycle reductions step by step.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-4 sm:gap-16 items-baseline py-16 border-t border-line">
                <span className="font-poppins text-[15px] leading-[1.4] font-semibold text-ink">
                  Dual Representation
                </span>
                <span className="font-mono text-[14px] leading-[1.7] text-muted">
                  Seamlessly connects visual graph theory (Resource Allocation Graphs and Wait-For Graphs) with formal matrix representations (Allocation, Request, and Available vectors).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-4 sm:gap-16 items-baseline py-16 border-t border-line last:border-b">
                <span className="font-poppins text-[15px] leading-[1.4] font-semibold text-ink">
                  Explainable Decisions
                </span>
                <span className="font-mono text-[14px] leading-[1.7] text-muted">
                  Rather than black-box evaluations, every state transition explains why an edge is claimed, why a request is delayed or denied, and how prevention policies alter system trajectories.
                </span>
              </div>
            </div>
          </section>

          {/* Section 3: Theoretical Foundations */}
          <section>
            <h2 className="font-poppins text-section-heading text-ink font-semibold mb-12">
              Theoretical Foundations
            </h2>
            <p className="font-mono text-[14px] leading-[1.7] text-muted">
              Built upon canonical literature in computer systems and concurrency, including Dijkstra&apos;s Banker&apos;s Algorithm (1965), Coffman&apos;s four necessary conditions (1971), and Holt&apos;s graph-theoretic foundations of resource allocation (1972).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
