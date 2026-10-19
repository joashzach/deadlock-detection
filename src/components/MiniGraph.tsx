import { useMemo } from 'react';
import clsx from 'clsx';
import { SystemState } from '../engine/types';

const PROCESS_RADIUS = 20;
const RESOURCE_HALF_W = 32;
const RESOURCE_HALF_H = 18;

function trim(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromR: number,
  toR: number
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: from.x + ux * fromR,
    y1: from.y + uy * fromR,
    x2: to.x - ux * toR,
    y2: to.y - uy * toR,
  };
}

export function MiniGraph({
  scenario,
  dangerIds,
  label,
  isPolicied = false,
}: {
  scenario: SystemState;
  positions?: Record<string, { x: number; y: number }>;
  dangerIds?: string[];
  label: string;
  isPolicied?: boolean;
}) {
  const danger = useMemo(() => new Set(dangerIds ?? []), [dangerIds]);

  const nP = scenario.processes.length;
  const nR = scenario.resources.length;
  const maxCount = Math.max(nP, nR, 1);
  const totalHeight = Math.max(280, maxCount * 54 + 40);
  const totalWidth = 320;
  const leftX = 64;
  const rightX = 256;

  // Compute natural order vertical positions
  const computedPositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const topPad = 36;
    const availH = totalHeight - topPad * 2;

    scenario.processes.forEach((p, idx) => {
      const y = nP === 1 ? totalHeight / 2 : topPad + (idx * availH) / (nP - 1);
      pos[p.id] = { x: leftX, y };
    });

    scenario.resources.forEach((r, idx) => {
      const y = nR === 1 ? totalHeight / 2 : topPad + (idx * availH) / (nR - 1);
      pos[r.id] = { x: rightX, y };
    });

    return pos;
  }, [scenario, nP, nR, totalHeight, leftX, rightX]);

  const radiusFor = (id: string) =>
    scenario.processes.some((p) => p.id === id) ? PROCESS_RADIUS : RESOURCE_HALF_W;

  const arrowId = isPolicied ? `mini-arrow-success-${label.replace(/\s+/g, '')}` : `mini-arrow-danger-${label.replace(/\s+/g, '')}`;
  const solidArrowId = `mini-arrow-solid-${label.replace(/\s+/g, '')}`;

  return (
    <svg
      className="w-full h-full block bg-white select-none"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <defs>
        <marker
          id={solidArrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0B1220" />
        </marker>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={isPolicied ? '#067647' : '#B42318'} />
        </marker>
      </defs>

      {/* Edges */}
      {scenario.edges.map((edge) => {
        const from = computedPositions[edge.from];
        const to = computedPositions[edge.to];
        if (!from || !to) return null;

        const isRequest = edge.type === 'request';
        const t = trim(from, to, radiusFor(edge.from), radiusFor(edge.to));

        const strokeColor = isRequest
          ? isPolicied
            ? '#067647'
            : '#B42318'
          : '#0B1220';
        const marker = isRequest ? `url(#${arrowId})` : `url(#${solidArrowId})`;

        return (
          <line
            key={edge.id}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeDasharray={isRequest ? '5 4' : undefined}
            markerEnd={marker}
          />
        );
      })}

      {/* Resource Nodes: Rectangles on Right */}
      {scenario.resources.map((r) => {
        const pos = computedPositions[r.id];
        if (!pos) return null;
        const isDanger = danger.has(r.id);
        return (
          <g key={r.id} transform={`translate(${pos.x},${pos.y})`}>
            <rect
              x={-RESOURCE_HALF_W}
              y={-RESOURCE_HALF_H}
              width={RESOURCE_HALF_W * 2}
              height={RESOURCE_HALF_H * 2}
              fill="#FFFFFF"
              stroke={isDanger ? '#B42318' : '#0B1220'}
              strokeWidth="1.5"
            />
            <text
              textAnchor="middle"
              dy={4}
              fontSize={13}
              fill={isDanger ? '#B42318' : '#0B1220'}
              className="font-mono select-none"
            >
              {r.id}
            </text>
          </g>
        );
      })}

      {/* Process Nodes: Circles on Left */}
      {scenario.processes.map((p) => {
        const pos = computedPositions[p.id];
        if (!pos) return null;
        const isDanger = danger.has(p.id);
        return (
          <g
            key={p.id}
            transform={`translate(${pos.x},${pos.y})`}
            className={clsx(isDanger && 'deadlock-pulse')}
          >
            <circle
              cx={0}
              cy={0}
              r={PROCESS_RADIUS}
              fill="#FFFFFF"
              stroke={isDanger ? '#B42318' : '#0B1220'}
              strokeWidth="1.5"
            />
            <text
              textAnchor="middle"
              dy={4}
              fontSize={13}
              fontWeight={500}
              fill={isDanger ? '#B42318' : '#0B1220'}
              className="font-mono select-none"
            >
              {p.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
