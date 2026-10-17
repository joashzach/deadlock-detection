import { COMPLEXITY } from '../lib/complexity';

export function About() {
  return (
    <div className="max-w-page mx-auto px-16 py-56 space-y-40">
      <section>
        <h1 className="section-heading text-heading-sm mb-16">About DeadlockLab</h1>
        <p className="text-charcoal max-w-[70ch] mb-16">
          DeadlockLab is an interactive teaching tool for operating-systems deadlocks. It is a fully client-side web app:
          no backend, no network calls at runtime, and no analytics. Everything you build stays in your browser.
        </p>
      </section>

      <section>
        <h2 className="section-heading text-body mb-16">How the engine works</h2>
        <p className="text-charcoal max-w-[70ch] mb-16">
          The engine is a pure TypeScript module with no React or DOM imports. Each algorithm returns a result plus an
          ordered list of steps. A step carries a title, a plain-English explanation generated from the actual numbers, a
          pseudocode line, the graph elements to highlight, and an immutable snapshot of the system state. The interface
          only replays traces — it never recomputes results on its own, so what you read always matches what ran.
        </p>
        <p className="text-charcoal max-w-[70ch]">
          The same scenario and the same seed always produce the same result and the same trace. This determinism is
          enforced by tests, including a cross-check that the single-instance cycle detector and the multi-instance
          matrix detector always agree about which processes are deadlocked.
        </p>
      </section>

      <section>
        <h2 className="section-heading text-body mb-16">Definitions used throughout</h2>
        <ul className="space-y-8 text-charcoal max-w-[70ch] list-disc pl-16">
          <li>
            <span className="font-semibold text-ink-black">Deadlocked set</span> — every process that can never finish
            under the current state. It includes processes on a wait cycle <em>and</em> processes permanently blocked
            waiting on them.
          </li>
          <li>
            <span className="font-semibold text-ink-black">Cycle members</span> — the processes actually forming a cycle
            in the Wait-For Graph. These are a subset of the deadlocked set.
          </li>
          <li>A process that is not waiting on anything is never deadlocked.</li>
        </ul>
      </section>

      <section>
        <h2 className="section-heading text-body mb-16">Complexity</h2>
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-body-sm">
            <caption className="sr-only">Algorithm complexity table</caption>
            <thead>
              <tr>
                {['Algorithm', 'Time', 'Space', 'Note'].map((h) => (
                  <th key={h} className="border border-fog px-8 py-4 text-left text-graphite">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPLEXITY.map((row) => (
                <tr key={row.algorithm}>
                  <td className="border border-fog px-8 py-4 text-ink-black">{row.algorithm}</td>
                  <td className="border border-fog px-8 py-4">{row.time}</td>
                  <td className="border border-fog px-8 py-4">{row.space}</td>
                  <td className="border border-fog px-8 py-4 text-graphite">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-heading text-body mb-16">Further reading</h2>
        <p className="text-charcoal max-w-[70ch]">
          Distributed deadlock detection, where no single node sees the whole graph, is out of scope here but worth
          knowing about — it is the natural next step after single-site detection. See Silberschatz, Galvin &amp; Gagne,
          <em> Operating System Concepts</em>, for the reference algorithms.
        </p>
      </section>
    </div>
  );
}
