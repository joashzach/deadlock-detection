import { Link } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    title: 'Build a scenario',
    body: 'Add processes and resources, or load a textbook example. Draw request (P→R) and assignment (R→P) edges, or edit the matrices directly.',
  },
  {
    n: '02',
    title: 'Run an algorithm',
    body: "Detect cycles with the Wait-For Graph or the multi-instance matrix algorithm, check safety with Banker's algorithm, or enable prevention policies.",
  },
  {
    n: '03',
    title: 'Watch and recover',
    body: 'Step through every decision in plain English, see exactly which resources move, then terminate or preempt to break the deadlock and confirm it is resolved.',
  },
];

const CAPABILITIES = [
  {
    title: 'Detection',
    body: 'Single-instance DFS cycle detection on the Wait-For Graph, and the multi-instance allocation/request matrix algorithm, with the exact deadlocked set.',
  },
  {
    title: 'Avoidance',
    body: "Banker's safety algorithm and the resource-request algorithm: granted, denied (unsafe), must wait, or error — each with the precise reason.",
  },
  {
    title: 'Prevention',
    body: 'Break hold-and-wait, no-preemption, or circular wait. Every rejected request names the policy and the Coffman condition it protects.',
  },
  {
    title: 'Recovery',
    body: 'Terminate all, terminate a victim, or preempt resources — then re-run detection automatically to prove the deadlock is gone.',
  },
];

export function Landing() {
  return (
    <>
      <div className="bg-obsidian text-off-white" data-testid="announcement">
        <div className="max-w-page mx-auto flex flex-wrap items-center gap-8 px-16 py-8 text-body-sm">
          <span className="chip chip-amber">T1–T8</span>
          <span>
            Every algorithm is verified against the textbook reference cases — detection, avoidance, prevention, and
            recovery.
          </span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-16 py-56 space-y-56">
      <section>
        <div className="accent-bar mb-16">
          <h1 className="text-heading font-semibold text-ink-black leading-tight">
            See deadlocks happen.
            <br />
            Then understand them.
          </h1>
        </div>
        <p className="text-subheading text-charcoal max-w-[62ch] mb-24">
          DeadlockLab simulates processes and resources, then runs real detection, avoidance, prevention, and recovery
          algorithms — step by step, in plain English.
        </p>
        <div className="flex flex-wrap gap-8">
          <Link to="/lab" className="btn btn-ember no-underline">
            Open the Lab
          </Link>
          <Link to="/learn" className="btn btn-ghost no-underline">
            Learn the theory
          </Link>
        </div>
      </section>

      <section>
        <h2 className="section-heading text-heading-sm mb-24">How it works</h2>
        <ol className="grid gap-24 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="panel p-24">
              <span className="chip chip-ember font-semibold">{s.n}</span>
              <h3 className="font-semibold text-ink-black mt-8 mb-8">{s.title}</h3>
              <p className="text-body-sm text-charcoal">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="section-heading text-heading-sm mb-24">What you can run</h2>
        <div className="grid gap-24 sm:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="panel p-24">
              <h3 className="font-semibold text-ink-black mb-8">{c.title}</h3>
              <p className="text-body-sm text-charcoal">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-24">
        <h2 className="section-heading text-heading-sm mb-8">Built for correctness</h2>
        <p className="text-charcoal mb-16 max-w-[62ch]">
          The algorithm engine is pure TypeScript with no UI dependencies. Every scenario, preset, and step trace is
          generated from the real engine — nothing is hard-coded — and the whole thing is covered by tests, including
          the Silberschatz textbook reference cases.
        </p>
        <Link to="/lab" className="btn btn-ember no-underline">
          Start with the classic deadlock
        </Link>
      </section>
      </div>
    </>
  );
}
