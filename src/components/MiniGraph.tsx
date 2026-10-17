import { useMemo } from 'react';
import clsx from 'clsx';
import { SystemState } from '../engine/types';
import { Positions } from '../lib/layout';

const PROCESS_RADIUS = 22;
const RESOURCE_HALF_W = 34;
const RESOURCE_HALF_H = 22;

function trim(from: { x: number; y: number }, to: { x: number; y: number }, fromR: number, toR: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return { x1: from.x + ux * fromR, y1: from.y + uy * fromR, x2: to.x - ux * toR, y2: to.y - uy * toR };
}

/**
 * Read-only, auto-fitting graph used for the simulator's side-by-side runs.
 * Deliberately small: it renders structure and deadlock emphasis, not interaction.
 */
export function MiniGraph({
  scenario,
  positions,
  dangerIds,
  label,
}: {
  scenario: SystemState;
  positions: Positions;
  dangerIds?: string[];
  label: string;
}) {
  const danger = useMemo(() => new Set(dangerIds ?? []), [dangerIds]);

  const allocatedByResource = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of scenario.resources) {
      map.set(
        r.id,
        scenario.edges.filter((e) => e.type === 'assignment' && e.from === r.id).reduce((s, e) => s + e.count, 0)
      );
    }
    return map;
  }, [scenario]);

  const viewBox = useMemo(() => {
    const ids = [...scenario.processes.map((p) => p.id), ...scenario.resources.map((r) => r.id)];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of ids) {
      const pos = positions[id];
      if (!pos) continue;
      minX = Math.min(minX, pos.x - RESOURCE_HALF_W);
      maxX = Math.max(maxX, pos.x + RESOURCE_HALF_W);
      minY = Math.min(minY, pos.y - RESOURCE_HALF_H);
      maxY = Math.max(maxY, pos.y + RESOURCE_HALF_H);
    }
    if (!Number.isFinite(minX)) return '0 0 200 120';
    const pad = 20;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [scenario, positions]);

  const radiusFor = (id: string) => (scenario.processes.some((p) => p.id === id) ? PROCESS_RADIUS : RESOURCE_HALF_W);

  return (
    <svg
      className="w-full h-[180px] block bg-off-white border border-fog"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <defs>
        <marker id="mini-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-obsidian)" />
        </marker>
        <marker id="mini-arrow-danger" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ember)" />
        </marker>
      </defs>

      {scenario.edges.map((edge) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        const dangerous = danger.has(edge.from) && danger.has(edge.to);
        const t = trim(from, to, radiusFor(edge.from), radiusFor(edge.to));
        return (
          <line
            key={edge.id}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={dangerous ? 'var(--color-ember)' : 'var(--color-graphite)'}
            strokeWidth={dangerous ? 2.5 : 1.25}
            strokeDasharray={edge.type === 'request' ? '5 4' : undefined}
            markerEnd={dangerous ? 'url(#mini-arrow-danger)' : 'url(#mini-arrow)'}
          />
        );
      })}

      {scenario.resources.map((r) => {
        const pos = positions[r.id];
        if (!pos) return null;
        return (
          <g key={r.id} transform={`translate(${pos.x},${pos.y})`}>
            <rect
              x={-RESOURCE_HALF_W}
              y={-RESOURCE_HALF_H}
              width={RESOURCE_HALF_W * 2}
              height={RESOURCE_HALF_H * 2}
              fill="var(--surface-card-cell)"
              stroke={danger.has(r.id) ? 'var(--color-ember)' : 'var(--color-charcoal)'}
              strokeWidth={danger.has(r.id) ? 2.5 : 1.5}
            />
            <text textAnchor="middle" dy={-2} fontSize={13} fill="var(--color-ink-black)" className="font-mono">
              {r.id}
            </text>
            <text textAnchor="middle" dy={13} fontSize={10} fill="var(--color-graphite)" className="font-mono">
              {allocatedByResource.get(r.id) ?? 0}/{r.totalInstances}
            </text>
          </g>
        );
      })}

      {scenario.processes.map((p) => {
        const pos = positions[p.id];
        if (!pos) return null;
        const isDanger = danger.has(p.id);
        return (
          <g key={p.id} transform={`translate(${pos.x},${pos.y})`} className={clsx(isDanger && 'deadlock-pulse')}>
            <circle
              cx={0}
              cy={0}
              r={PROCESS_RADIUS}
              fill={isDanger ? 'var(--color-obsidian)' : 'var(--surface-card-cell)'}
              stroke={isDanger ? 'var(--color-ember)' : 'var(--color-charcoal)'}
              strokeWidth={isDanger ? 2.5 : 1.5}
            />
            <text
              textAnchor="middle"
              dy={4}
              fontSize={13}
              fontWeight={600}
              fill={isDanger ? 'var(--color-off-white)' : 'var(--color-ink-black)'}
              className="font-mono"
            >
              {p.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
