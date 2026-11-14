import { SystemState } from '../engine/types';
import { PRESETS } from '../scenarios/presets';

interface CoffmanStatusLike {
  mutualExclusion: boolean;
  holdAndWait: boolean;
  noPreemption: boolean;
  circularWait: boolean;
}

export function RagVsWfgDiagram({ scenario }: { scenario: SystemState }) {
  const activeScenario = scenario.processes.length >= 2 && scenario.resources.length >= 1
    ? scenario
    : PRESETS['classic-deadlock']!.state;

  const pList = activeScenario.processes.slice(0, 2);
  const rList = activeScenario.resources.slice(0, 2);

  const p1 = pList[0]?.id ?? 'P1';
  const p2 = pList[1]?.id ?? 'P2';
  const r1 = rList[0]?.id ?? 'R1';
  const r2 = rList[1]?.id ?? 'R2';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full">
      {/* 1. RAG Card: Minimal, clean, unobstructed */}
      <div className="border border-line p-16 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-poppins font-semibold text-ink text-[14px]">
              1. Resource Allocation Graph (RAG)
            </h3>
          </div>
          <p className="font-mono text-[11px] text-muted mb-12">
            Bipartite graph with processes (circles) and resources (boxes)
          </p>

          <div className="w-full border border-line bg-tint-bg/20 overflow-hidden">
            <svg
              viewBox="0 0 320 160"
              className="w-full h-[150px] block"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Resource Allocation Graph diagram"
            >
              <defs>
                <marker
                  id="rag-arrow-asg"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0F2557" />
                </marker>
                <marker
                  id="rag-arrow-req"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B42318" />
                </marker>
              </defs>

              {/* Assignment Edges (R -> P): Solid Navy */}
              {/* R1 -> P1 */}
              <line
                x1="232"
                y1="44"
                x2="84"
                y2="44"
                stroke="#0F2557"
                strokeWidth="1.75"
                markerEnd="url(#rag-arrow-asg)"
              />
              {/* R2 -> P2 */}
              <line
                x1="232"
                y1="116"
                x2="84"
                y2="116"
                stroke="#0F2557"
                strokeWidth="1.75"
                markerEnd="url(#rag-arrow-asg)"
              />

              {/* Request Edges (P -> R): Dashed Red */}
              {/* P1 -> R2 */}
              <line
                x1="80"
                y1="52"
                x2="232"
                y2="110"
                stroke="#B42318"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#rag-arrow-req)"
              />
              {/* P2 -> R1 */}
              <line
                x1="80"
                y1="108"
                x2="232"
                y2="50"
                stroke="#B42318"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#rag-arrow-req)"
              />

              {/* Process 1 */}
              <circle cx="64" cy="44" r="18" fill="#FFFFFF" stroke="#0F2557" strokeWidth="2" />
              <text x="64" y="48" textAnchor="middle" className="font-mono text-[11px] font-bold" fill="#0B1220">
                {p1}
              </text>

              {/* Process 2 */}
              <circle cx="64" cy="116" r="18" fill="#FFFFFF" stroke="#0F2557" strokeWidth="2" />
              <text x="64" y="120" textAnchor="middle" className="font-mono text-[11px] font-bold" fill="#0B1220">
                {p2}
              </text>

              {/* Resource 1 */}
              <rect x="232" y="30" width="44" height="28" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" />
              <text x="254" y="45" textAnchor="middle" className="font-mono text-[11px] font-bold" fill="#0B1220">
                {r1}
              </text>
              <circle cx="254" cy="52" r="2" fill="#0F2557" />

              {/* Resource 2 */}
              <rect x="232" y="102" width="44" height="28" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" />
              <text x="254" y="117" textAnchor="middle" className="font-mono text-[11px] font-bold" fill="#0B1220">
                {r2}
              </text>
              <circle cx="254" cy="124" r="2" fill="#0F2557" />
            </svg>
          </div>
        </div>

        {/* Minimal Legend */}
        <div className="mt-10 pt-8 border-t border-line flex items-center justify-between font-mono text-[10px] text-muted">
          <span className="flex items-center gap-6">
            <span className="inline-block w-10 h-[2px] bg-navy" /> R → P (Held)
          </span>
          <span className="flex items-center gap-6">
            <span className="inline-block w-10 h-[2px] border-b-2 border-dashed border-danger" /> P → R (Requested)
          </span>
        </div>
      </div>

      {/* 2. WFG Card: Minimal, clean, direct dependency loop */}
      <div className="border border-line p-16 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-poppins font-semibold text-ink text-[14px]">
              2. Wait-For Graph (WFG)
            </h3>
          </div>
          <p className="font-mono text-[11px] text-muted mb-12">
            Resources collapsed — processes wait directly on each other
          </p>

          <div className="w-full border border-line bg-tint-bg/20 overflow-hidden">
            <svg
              viewBox="0 0 320 160"
              className="w-full h-[150px] block"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Wait-For Graph diagram"
            >
              <defs>
                <marker
                  id="wfg-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B42318" />
                </marker>
              </defs>

              {/* Top Arc: P1 -> P2 */}
              <path
                d="M 102 68 C 135 32, 185 32, 218 68"
                fill="none"
                stroke="#B42318"
                strokeWidth="1.75"
                markerEnd="url(#wfg-arrow)"
              />
              <text x="160" y="32" textAnchor="middle" className="font-mono text-[9px] font-medium" fill="#B42318">
                waits for {p2} (needs {r2})
              </text>

              {/* Bottom Arc: P2 -> P1 */}
              <path
                d="M 218 92 C 185 128, 135 128, 102 92"
                fill="none"
                stroke="#B42318"
                strokeWidth="1.75"
                markerEnd="url(#wfg-arrow)"
              />
              <text x="160" y="138" textAnchor="middle" className="font-mono text-[9px] font-medium" fill="#B42318">
                waits for {p1} (needs {r1})
              </text>

              {/* Process 1 */}
              <circle cx="80" cy="80" r="22" fill="#FFFFFF" stroke="#B42318" strokeWidth="2" />
              <text x="80" y="84" textAnchor="middle" className="font-mono text-[12px] font-bold" fill="#0B1220">
                {p1}
              </text>

              {/* Process 2 */}
              <circle cx="240" cy="80" r="22" fill="#FFFFFF" stroke="#B42318" strokeWidth="2" />
              <text x="240" y="84" textAnchor="middle" className="font-mono text-[12px] font-bold" fill="#0B1220">
                {p2}
              </text>

              {/* Center subtle dependency indicator */}
              <text x="160" y="84" textAnchor="middle" className="font-mono text-[10px] font-medium" fill="#566079">
                {p1} ⇄ {p2}
              </text>
            </svg>
          </div>
        </div>

        {/* Minimal Legend */}
        <div className="mt-10 pt-8 border-t border-line flex items-center justify-between font-mono text-[10px] text-muted">
          <span>Direct wait dependencies</span>
          <span className="text-danger font-semibold">Cycle = Deadlock</span>
        </div>
      </div>
    </div>
  );
}

export function CoffmanDiagram({ assessment }: { assessment: CoffmanStatusLike | null }) {
  const conditions = [
    { name: 'Mutual Exclusion', key: 'mutualExclusion' as const },
    { name: 'Hold & Wait', key: 'holdAndWait' as const },
    { name: 'No Preemption', key: 'noPreemption' as const },
    { name: 'Circular Wait', key: 'circularWait' as const },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 w-full">
      {conditions.map((c) => {
        const holds = assessment?.[c.key] ?? false;
        return (
          <div
            key={c.key}
            className="border border-line p-12 bg-white text-center flex flex-col justify-between"
          >
            <p className="font-poppins font-medium text-[13px] text-ink mb-6">{c.name}</p>
            <span
              className={`font-mono text-[11px] px-6 py-2 border inline-block ${
                holds
                  ? 'border-danger/30 bg-danger-tint text-danger font-medium'
                  : 'border-line bg-tint-bg text-muted'
              }`}
            >
              {holds ? 'Holds' : 'Does not hold'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
