import { useMemo } from 'react';
import { SystemState } from '../engine/types';
import { convertRAGtoWFG } from '../engine/rag';
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

  const wfg = useMemo(() => {
    try {
      return convertRAGtoWFG(activeScenario);
    } catch {
      return convertRAGtoWFG(PRESETS['classic-deadlock']!.state);
    }
  }, [activeScenario]);

  // Positions for 2 processes + 2 resources in a compact diagram
  const pList = activeScenario.processes.slice(0, 3);
  const rList = activeScenario.resources.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full">
      {/* RAG Card */}
      <div className="panel p-16 bg-off-white">
        <div className="flex items-center justify-between mb-8">
          <p className="font-semibold text-ink-black text-body-sm">Resource Allocation Graph (RAG)</p>
          <span className="text-graphite font-mono text-xs">Bipartite</span>
        </div>
        <svg viewBox="0 0 300 170" className="w-full h-[170px] border border-fog bg-canvas">
          <defs>
            <marker id="rag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-obsidian)" />
            </marker>
            <marker id="rag-req-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ember)" />
            </marker>
          </defs>

          {/* RAG Edges */}
          <line x1="60" y1="45" x2="230" y2="120" stroke="var(--color-ember)" strokeWidth="1.75" strokeDasharray="5 4" markerEnd="url(#rag-req-arrow)" />
          <line x1="230" y1="45" x2="60" y2="45" stroke="var(--color-obsidian)" strokeWidth="2" markerEnd="url(#rag-arrow)" />
          <line x1="60" y1="120" x2="230" y2="45" stroke="var(--color-ember)" strokeWidth="1.75" strokeDasharray="5 4" markerEnd="url(#rag-req-arrow)" />
          <line x1="230" y1="120" x2="60" y2="120" stroke="var(--color-obsidian)" strokeWidth="2" markerEnd="url(#rag-arrow)" />

          {/* Process 1 */}
          <circle cx="60" cy="45" r="22" fill="var(--surface-card-cell)" stroke="var(--color-ink-black)" strokeWidth="2" />
          <text x="60" y="50" textAnchor="middle" className="font-mono text-xs font-semibold" fill="var(--color-ink-black)">
            {pList[0]?.id ?? 'P1'}
          </text>

          {/* Process 2 */}
          <circle cx="60" cy="120" r="22" fill="var(--surface-card-cell)" stroke="var(--color-ink-black)" strokeWidth="2" />
          <text x="60" y="125" textAnchor="middle" className="font-mono text-xs font-semibold" fill="var(--color-ink-black)">
            {pList[1]?.id ?? 'P2'}
          </text>

          {/* Resource 1 */}
          <rect x="206" y="27" width="56" height="36" fill="var(--surface-card-cell)" stroke="var(--color-charcoal)" strokeWidth="1.5" />
          <text x="234" y="44" textAnchor="middle" className="font-mono text-xs font-semibold" fill="var(--color-ink-black)">
            {rList[0]?.id ?? 'R1'}
          </text>
          <circle cx="234" cy="55" r="3" fill="var(--color-obsidian)" />

          {/* Resource 2 */}
          <rect x="206" y="102" width="56" height="36" fill="var(--surface-card-cell)" stroke="var(--color-charcoal)" strokeWidth="1.5" />
          <text x="234" y="119" textAnchor="middle" className="font-mono text-xs font-semibold" fill="var(--color-ink-black)">
            {rList[1]?.id ?? 'R2'}
          </text>
          <circle cx="234" cy="130" r="3" fill="var(--color-obsidian)" />
        </svg>
        <p className="text-xs text-graphite mt-8">Processes on left, resources on right with instance dots.</p>
      </div>

      {/* WFG Card */}
      <div className="panel p-16 bg-off-white">
        <div className="flex items-center justify-between mb-8">
          <p className="font-semibold text-ink-black text-body-sm">Wait-For Graph (WFG)</p>
          <span className="text-graphite font-mono text-xs">Engine-derived</span>
        </div>
        <svg viewBox="0 0 300 170" className="w-full h-[170px] border border-fog bg-canvas">
          <defs>
            <marker id="wfg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ember)" />
            </marker>
          </defs>

          {/* Circular Wait Edges between P1 and P2 */}
          <path d="M 120 70 C 130 50, 170 50, 180 70" fill="none" stroke="var(--color-ember)" strokeWidth="2" markerEnd="url(#wfg-arrow)" className="deadlock-pulse" />
          <path d="M 180 95 C 170 115, 130 115, 120 95" fill="none" stroke="var(--color-ember)" strokeWidth="2" markerEnd="url(#wfg-arrow)" className="deadlock-pulse" />

          {/* Process 1 */}
          <circle cx="100" cy="82" r="24" fill="var(--color-obsidian)" stroke="var(--color-ember)" strokeWidth="2.5" className="deadlock-pulse" />
          <text x="100" y="87" textAnchor="middle" className="font-mono text-xs font-semibold" fill="var(--color-off-white)">
            {wfg.processIds[0] ?? 'P1'}
          </text>

          {/* Process 2 */}
          <circle cx="200" cy="82" r="24" fill="var(--color-obsidian)" stroke="var(--color-ember)" strokeWidth="2.5" className="deadlock-pulse" />
          <text x="200" y="87" textAnchor="middle" className="font-mono text-xs font-semibold" fill="var(--color-off-white)">
            {wfg.processIds[1] ?? 'P2'}
          </text>

          <text x="150" y="42" textAnchor="middle" className="font-mono text-[10px]" fill="var(--color-ember)">waits via R2</text>
          <text x="150" y="132" textAnchor="middle" className="font-mono text-[10px]" fill="var(--color-ember)">waits via R1</text>
        </svg>
        <p className="text-xs text-graphite mt-8">Resources collapsed; cycle indicates deadlock directly.</p>
      </div>
    </div>
  );
}

export function CoffmanDiagram({ assessment }: { assessment: CoffmanStatusLike | null }) {
  const conditions = [
    { key: 'mutualExclusion', label: 'Mutual Exclusion', short: 'Mutex', glyph: '🔒', x: 150, y: 35 },
    { key: 'holdAndWait', label: 'Hold & Wait', short: 'Hold&Wait', glyph: '⏳', x: 250, y: 100 },
    { key: 'circularWait', label: 'Circular Wait', short: 'Circ Wait', glyph: '🔄', x: 150, y: 165 },
    { key: 'noPreemption', label: 'No Preemption', short: 'No Preempt', glyph: '⛔', x: 50, y: 100 },
  ] as const;

  const allHold = assessment
    ? assessment.mutualExclusion && assessment.holdAndWait && assessment.noPreemption && assessment.circularWait
    : false;

  return (
    <div className="panel p-16 bg-off-white space-y-16">
      <div className="flex items-center justify-between border-b border-fog pb-8">
        <div>
          <p className="font-semibold text-ink-black text-body-sm">Coffman Conditions Diagram</p>
          <p className="text-xs text-graphite">Real engine assessment for active scenario</p>
        </div>
        <span className={allHold ? 'chip chip-ember text-xs' : 'chip chip-inverse text-xs'}>
          {allHold ? '⚠ All 4 Hold' : '✓ Chain Broken'}
        </span>
      </div>

      {/* Inline SVG Coffman Chain */}
      <svg viewBox="0 0 300 200" className="w-full h-[180px] border border-fog bg-canvas">
        <defs>
          <marker id="coff-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={allHold ? 'var(--color-ember)' : 'var(--color-charcoal)'} />
          </marker>
        </defs>

        {/* Chain connecting the 4 conditions */}
        {/* Top to Right */}
        <line x1="180" y1="50" x2="230" y2="85" stroke={assessment?.mutualExclusion && assessment?.holdAndWait ? 'var(--color-ember)' : 'var(--color-fog)'} strokeWidth="2" markerEnd="url(#coff-arrow)" />
        {/* Right to Bottom */}
        <line x1="230" y1="115" x2="180" y2="150" stroke={assessment?.holdAndWait && assessment?.circularWait ? 'var(--color-ember)' : 'var(--color-fog)'} strokeWidth="2" markerEnd="url(#coff-arrow)" />
        {/* Bottom to Left */}
        <line x1="120" y1="150" x2="70" y2="115" stroke={assessment?.circularWait && assessment?.noPreemption ? 'var(--color-ember)' : 'var(--color-fog)'} strokeWidth="2" markerEnd="url(#coff-arrow)" />
        {/* Left to Top */}
        <line x1="70" y1="85" x2="120" y2="50" stroke={assessment?.noPreemption && assessment?.mutualExclusion ? 'var(--color-ember)' : 'var(--color-fog)'} strokeWidth="2" markerEnd="url(#coff-arrow)" />

        {/* Center state badge */}
        <circle
          cx="150"
          cy="100"
          r="28"
          fill={allHold ? 'var(--color-obsidian)' : 'var(--surface-canvas)'}
          stroke={allHold ? 'var(--color-ember)' : 'var(--color-fog)'}
          strokeWidth="2"
          className={allHold ? 'deadlock-pulse' : ''}
        />
        <text
          x="150"
          y="98"
          textAnchor="middle"
          className="font-mono text-[9px] font-semibold"
          fill={allHold ? 'var(--color-off-white)' : 'var(--color-graphite)'}
        >
          {allHold ? 'DEADLOCK' : 'SAFE'}
        </text>
        <text
          x="150"
          y="110"
          textAnchor="middle"
          className="font-mono text-[8px]"
          fill={allHold ? 'var(--color-ember)' : 'var(--color-graphite)'}
        >
          {allHold ? 'POSSIBLE' : 'PROTECTED'}
        </text>

        {/* 4 condition nodes */}
        {conditions.map((c) => {
          const holds = assessment ? assessment[c.key] : false;
          return (
            <g key={c.key}>
              <circle
                cx={c.x}
                cy={c.y}
                r="22"
                fill={holds ? 'var(--surface-card-cell)' : 'var(--surface-canvas)'}
                stroke={holds ? 'var(--color-ember)' : 'var(--color-fog)'}
                strokeWidth={holds ? '2' : '1.5'}
                strokeDasharray={holds ? 'none' : '3 2'}
              />
              <text x={c.x} y={c.y - 4} textAnchor="middle" className="text-xs">
                {c.glyph}
              </text>
              <text
                x={c.x}
                y={c.y + 11}
                textAnchor="middle"
                className="font-mono text-[8px] font-semibold"
                fill={holds ? 'var(--color-ink-black)' : 'var(--color-graphite)'}
              >
                {c.short}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Condition status summary list */}
      <div className="grid grid-cols-2 gap-8">
        {conditions.map((c) => {
          const holds = assessment ? assessment[c.key] : false;
          return (
            <div
              key={c.key}
              className={`border p-8 flex items-center justify-between text-xs ${
                holds ? 'border-ember bg-amber/5 text-ink-black' : 'border-fog bg-card-cell text-graphite opacity-80'
              }`}
            >
              <span className="font-mono">{c.label}</span>
              <span className={holds ? 'text-ember font-semibold' : 'text-graphite'}>
                {holds ? 'Holds' : 'No'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

