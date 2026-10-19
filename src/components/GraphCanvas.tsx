import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useLabStore } from '../store/useLabStore';
import { useDisplayedScenario } from '../store/selectors';
import { computeCycleEdgeIds } from '../lib/cycleEdges';
import { StateMarker } from './ui/Primitives';

const PROCESS_RADIUS = 30;
const RESOURCE_HALF_W = 54;
const RESOURCE_HALF_H = 38;
const RESOURCE_RADIUS = 58; // approximate radius for edge trimming

interface Viewport {
  x: number;
  y: number;
  k: number;
}

type DragState =
  | { mode: 'pan'; pointerId: number; startX: number; startY: number; originX: number; originY: number }
  | { mode: 'node'; pointerId: number; nodeId: string; startX: number; startY: number; originX: number; originY: number }
  | null;

function trim(from: { x: number; y: number }, to: { x: number; y: number }, fromR: number, toR: number) {
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
    mx: (from.x + to.x) / 2,
    my: (from.y + to.y) / 2,
  };
}

export function GraphCanvas() {
  const scenario = useDisplayedScenario();
  const positions = useLabStore((s) => s.positions);
  const selectedNodeId = useLabStore((s) => s.selectedNodeId);
  const detection = useLabStore((s) => s.detection);
  const traceSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);
  const selectNode = useLabStore((s) => s.selectNode);
  const setNodePosition = useLabStore((s) => s.setNodePosition);

  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, k: 1 });
  const [legendOpen, setLegendOpen] = useState(false);
  const dragRef = useRef<DragState>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; k: number; cx: number; cy: number } | null>(null);

  const currentStep = traceSteps[stepIndex];

  const allocatedByResource = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of scenario.resources) {
      map.set(
        r.id,
        scenario.edges
          .filter((e) => e.type === 'assignment' && e.from === r.id)
          .reduce((sum, e) => sum + e.count, 0)
      );
    }
    return map;
  }, [scenario]);

  const cycleEdgeIds = useMemo(() => computeCycleEdgeIds(scenario, detection), [scenario, detection]);

  const cycleResourceIds = useMemo(() => {
    const set = new Set<string>();
    for (const edge of scenario.edges) {
      if (cycleEdgeIds.has(edge.id)) {
        if (edge.type === 'assignment') {
          set.add(edge.from);
        } else if (edge.type === 'request') {
          set.add(edge.to);
        }
      }
    }
    return set;
  }, [scenario.edges, cycleEdgeIds]);

  const dangerNodes = useMemo(() => {
    const set = new Set<string>();
    if (detection?.hasDeadlock) {
      for (const id of detection.deadlockedProcessIds) set.add(id);
      for (const id of cycleResourceIds) set.add(id);
    }
    if (currentStep?.highlight?.type === 'danger') {
      for (const id of currentStep.highlight.nodeIds ?? []) set.add(id);
      for (const id of cycleResourceIds) set.add(id);
    }
    return set;
  }, [detection, currentStep, cycleResourceIds]);

  const warningNodes = useMemo(() => {
    const set = new Set<string>();
    if (currentStep?.highlight?.type === 'warning') {
      for (const id of currentStep.highlight.nodeIds ?? []) set.add(id);
    }
    return set;
  }, [currentStep]);

  const activeNodes = useMemo(() => {
    const set = new Set<string>();
    if (currentStep?.highlight && currentStep.highlight.type === 'active') {
      for (const id of currentStep.highlight.nodeIds ?? []) set.add(id);
    }
    return set;
  }, [currentStep]);

  const successNodes = useMemo(() => {
    const set = new Set<string>();
    if (currentStep?.highlight?.type === 'success') {
      for (const id of currentStep.highlight.nodeIds ?? []) set.add(id);
    }
    return set;
  }, [currentStep]);

  const highlightedEdges = useMemo(() => {
    const set = new Set<string>(currentStep?.highlight?.edgeIds ?? []);
    return set;
  }, [currentStep]);

  const fitToScreen = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const ids = [...scenario.processes.map((p) => p.id), ...scenario.resources.map((r) => r.id)];
    if (ids.length === 0) {
      setView({ x: 0, y: 0, k: 1 });
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of ids) {
      const pos = positions[id];
      if (!pos) continue;
      minX = Math.min(minX, pos.x - RESOURCE_RADIUS);
      maxX = Math.max(maxX, pos.x + RESOURCE_RADIUS);
      minY = Math.min(minY, pos.y - RESOURCE_RADIUS);
      maxY = Math.max(maxY, pos.y + RESOURCE_RADIUS);
    }
    const pad = 24;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const safeAreaBottom = 56;
    const availableHeight = Math.max(100, rect.height - safeAreaBottom);
    const k = Math.min(rect.width / w, availableHeight / h, 1.6);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({
      x: rect.width / 2 - cx * k,
      y: (rect.height - safeAreaBottom) / 2 - cy * k,
      k,
    });
  }, [positions, scenario]);

  // Auto-fit on load and preset/scenario change
  useEffect(() => {
    fitToScreen();
  }, [fitToScreen, scenario]);

  // Auto-fit on canvas resize
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let observer: ResizeObserver | null = null;
    let timeoutId: number | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          fitToScreen();
        }, 150);
      });
      observer.observe(svg);
    }
    window.addEventListener('resize', fitToScreen);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener('resize', fitToScreen);
    };
  }, [fitToScreen]);

  // Wheel zoom must be a non-passive listener so preventDefault works (React's onWheel is passive).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        const k = Math.max(0.3, Math.min(2.5, v.k * factor));
        return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k };
      });
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, []);

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - view.x) / view.k,
        y: (clientY - rect.top - view.y) / view.k,
      };
    },
    [view]
  );

  const onPointerDownBackground = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        dist: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        k: view.k,
        cx: (a!.x + b!.x) / 2,
        cy: (a!.y + b!.y) / 2,
      };
      dragRef.current = null;
      return;
    }
    dragRef.current = {
      mode: 'pan',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: view.x,
      originY: view.y,
    };
    selectNode(null);
  };

  const onPointerDownNode = (e: React.PointerEvent<SVGGElement>, nodeId: string) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    svg.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pos = positions[nodeId] ?? { x: 0, y: 0 };
    dragRef.current = {
      mode: 'node',
      pointerId: e.pointerId,
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    selectNode(nodeId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const k = Math.max(0.3, Math.min(2.5, pinchRef.current.k * (dist / (pinchRef.current.dist || 1))));
      setView((v) => ({ ...v, k }));
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.mode === 'pan') {
      setView((v) => ({
        ...v,
        x: drag.originX + (e.clientX - drag.startX),
        y: drag.originY + (e.clientY - drag.startY),
      }));
    } else {
      const p = toWorld(e.clientX, e.clientY);
      const orig = toWorld(drag.startX, drag.startY);
      setNodePosition(drag.nodeId, drag.originX + (p.x - orig.x), drag.originY + (p.y - orig.y));
    }
  };

  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const nodeRadius = (id: string) => (scenario.processes.some((p) => p.id === id) ? PROCESS_RADIUS : RESOURCE_RADIUS);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none select-none bg-off-white"
        role="application"
        aria-label="Resource Allocation Graph canvas"
        onPointerDown={onPointerDownBackground}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <defs>
          <marker id="arrow-solid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-obsidian)" />
          </marker>
          <marker id="arrow-request" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-graphite)" />
          </marker>
          <marker id="arrow-danger" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ember)" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ink-black)" />
          </marker>
        </defs>

        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {/* Edges */}
          {scenario.edges.map((edge) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;
            const isDanger = cycleEdgeIds.has(edge.id);
            const isHighlighted = highlightedEdges.has(edge.id);
            const isRequest = edge.type === 'request';
            const stroke = isDanger
              ? 'var(--color-ember)'
              : isHighlighted
                ? 'var(--color-ink-black)'
                : isRequest
                  ? 'var(--color-graphite)'
                  : 'var(--color-obsidian)';
            const marker = isDanger
              ? 'url(#arrow-danger)'
              : isHighlighted
                ? 'url(#arrow-active)'
                : isRequest
                  ? 'url(#arrow-request)'
                  : 'url(#arrow-solid)';
            const t = trim(from, to, nodeRadius(edge.from), nodeRadius(edge.to));
            return (
              <g
                key={edge.id}
                className={clsx(isDanger && 'deadlock-pulse')}
                data-testid={isDanger ? 'cycle-edge' : 'graph-edge'}
              >
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={stroke}
                  strokeWidth={isDanger || isHighlighted ? 3.5 : 1.5}
                  strokeDasharray={isRequest ? '6 5' : undefined}
                  markerEnd={marker}
                  data-testid={isDanger ? 'cycle-edge-line' : undefined}
                />
                {edge.count > 1 && (
                  <text
                    x={t.mx}
                    y={t.my - 6}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={12}
                    fill="var(--color-graphite)"
                  >
                    ×{edge.count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Resource nodes */}
          {scenario.resources.map((resource) => {
            const pos = positions[resource.id];
            if (!pos) return null;
            const allocated = allocatedByResource.get(resource.id) ?? 0;
            const isDanger = dangerNodes.has(resource.id);
            const isSelected = selectedNodeId === resource.id;
            return (
              <g
                key={resource.id}
                role="button"
                tabIndex={0}
                aria-label={`Resource ${resource.id}: ${allocated} of ${resource.totalInstances} instances allocated${isDanger ? ', in deadlock cycle' : ''}`}
                transform={`translate(${pos.x},${pos.y})`}
                className={clsx('cursor-grab', isDanger && 'deadlock-pulse')}
                data-testid={isDanger ? 'cycle-resource-node' : 'resource-node'}
                onPointerDown={(e) => onPointerDownNode(e, resource.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectNode(resource.id);
                  }
                }}
              >
                <rect
                  x={-RESOURCE_HALF_W}
                  y={-RESOURCE_HALF_H}
                  width={RESOURCE_HALF_W * 2}
                  height={RESOURCE_HALF_H * 2}
                  fill={isDanger ? 'var(--color-obsidian)' : 'var(--surface-card-cell)'}
                  stroke={isDanger ? 'var(--color-ember)' : isSelected ? 'var(--color-ink-black)' : 'var(--color-charcoal)'}
                  strokeWidth={isSelected || isDanger ? 3 : 2}
                  rx={0}
                />
                <text
                  textAnchor="middle"
                  dy={-12}
                  className="font-mono"
                  fontSize={16}
                  fontWeight={600}
                  fill={isDanger ? 'var(--color-off-white)' : 'var(--color-ink-black)'}
                >
                  {resource.id}
                </text>
                <text
                  textAnchor="middle"
                  dy={4}
                  className="font-mono"
                  fontSize={12}
                  fontWeight={500}
                  fill={isDanger ? 'var(--color-fog)' : 'var(--color-graphite)'}
                >
                  {allocated}/{resource.totalInstances}
                </text>
                {/* Instance dots inside the card: filled = allocated */}
                <g transform={`translate(${-((resource.totalInstances - 1) * 10) / 2}, 22)`}>
                  {Array.from({ length: resource.totalInstances }, (_, i) => (
                    <circle
                      key={i}
                      cx={i * 10}
                      cy={0}
                      r={3.5}
                      fill={i < allocated ? (isDanger ? 'var(--color-ember)' : 'var(--color-obsidian)') : 'var(--surface-canvas)'}
                      stroke={isDanger ? 'var(--color-ember)' : 'var(--color-charcoal)'}
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
                {isDanger && (
                  <text
                    textAnchor="middle"
                    dy={-RESOURCE_HALF_H - 8}
                    className="font-mono font-medium"
                    fontSize={12}
                    fill="var(--color-ember)"
                  >
                    ⚠ in deadlock
                  </text>
                )}
              </g>
            );
          })}

          {/* Process nodes */}
          {scenario.processes.map((process) => {
            const pos = positions[process.id];
            if (!pos) return null;
            const isDanger = dangerNodes.has(process.id);
            const isWarning = warningNodes.has(process.id);
            const isActive = activeNodes.has(process.id);
            const isSuccess = successNodes.has(process.id);
            const isSelected = selectedNodeId === process.id;
            const stroke = isDanger
              ? 'var(--color-ember)'
              : isWarning
                ? 'var(--color-amber)'
                : isActive || isSuccess
                  ? 'var(--color-ink-black)'
                  : isSelected
                    ? 'var(--color-ink-black)'
                    : 'var(--color-charcoal)';
            return (
              <g
                key={process.id}
                role="button"
                tabIndex={0}
                aria-label={`Process ${process.id}${isDanger ? ', deadlocked' : ''}`}
                transform={`translate(${pos.x},${pos.y})`}
                className={clsx('cursor-grab', isDanger && 'deadlock-pulse')}
                data-testid={isDanger ? 'cycle-process-node' : 'process-node'}
                onPointerDown={(e) => onPointerDownNode(e, process.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectNode(process.id);
                  }
                }}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={PROCESS_RADIUS}
                  fill={isDanger ? 'var(--color-obsidian)' : 'var(--surface-card-cell)'}
                  stroke={stroke}
                  strokeWidth={isSelected || isDanger || isActive ? 3 : 2}
                />
                <text
                  textAnchor="middle"
                  dy={5}
                  className="font-mono"
                  fontSize={16}
                  fontWeight={600}
                  fill={isDanger ? 'var(--color-off-white)' : 'var(--color-ink-black)'}
                >
                  {process.id}
                </text>
                {isDanger && (
                  <text
                    textAnchor="middle"
                    dy={-PROCESS_RADIUS - 8}
                    className="font-mono font-medium"
                    fontSize={12}
                    fill="var(--color-ember)"
                  >
                    ⚠ deadlocked
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Canvas controls: ONE compact vertical group at bottom-right, inset 16px */}
      <div
        data-testid="zoom-controls"
        className="absolute bottom-16 right-16 flex flex-col z-10 border border-line bg-white shadow-none"
      >
        <button
          type="button"
          className="h-[var(--ctrl-h)] w-[var(--ctrl-h)] flex items-center justify-center font-mono text-[13px] text-ink bg-white hover:bg-tint-bg transition-colors border-b border-line cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
          onClick={fitToScreen}
          aria-label="Fit graph to screen"
        >
          Fit
        </button>
        <button
          type="button"
          className="h-[var(--ctrl-h)] w-[var(--ctrl-h)] flex items-center justify-center font-mono text-[14px] text-ink bg-white hover:bg-tint-bg transition-colors border-b border-line cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
          onClick={() => setView((v) => ({ ...v, k: Math.min(2.5, v.k * 1.2) }))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="h-[var(--ctrl-h)] w-[var(--ctrl-h)] flex items-center justify-center font-mono text-[14px] text-ink bg-white hover:bg-tint-bg transition-colors cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
          onClick={() => setView((v) => ({ ...v, k: Math.max(0.3, v.k / 1.2) }))}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Collapsible Legend at bottom-left: height var(--ctrl-h), auto width, inset 16px */}
      <div data-testid="legend-control" className="absolute bottom-16 left-16 z-10 text-body-sm">
        {!legendOpen ? (
          <button
            type="button"
            className="h-[var(--ctrl-h)] px-12 border border-line bg-white text-ink font-mono text-[13px] flex items-center gap-6 cursor-pointer select-none hover:bg-tint-bg transition-colors outline-none focus-visible:outline-2 focus-visible:outline-navy"
            onClick={() => setLegendOpen(true)}
            aria-expanded={false}
            aria-label="Open graph legend"
          >
            <span className="font-medium">Legend</span>
            <span aria-hidden="true">▴</span>
          </button>
        ) : (
          <div className="border border-line p-16 w-[280px] sm:w-[320px] bg-white shadow-none">
            <div className="flex items-center justify-between gap-16 mb-8 border-b border-line pb-4">
              <p className="font-poppins font-semibold text-ink text-[14px]">Legend</p>
              <button
                type="button"
                className="font-mono text-muted hover:text-ink cursor-pointer p-2 text-[14px]"
                onClick={() => setLegendOpen(false)}
                aria-expanded={true}
                aria-label="Close graph legend"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-6 text-muted font-mono text-[12px]">
              <li className="flex items-center gap-8">
                <svg width="34" height="10" aria-hidden="true" className="shrink-0">
                  <line x1="0" y1="5" x2="34" y2="5" stroke="#566079" strokeWidth="1.5" strokeDasharray="6 5" />
                </svg>
                <span className="whitespace-normal">Request edge (dashed)</span>
              </li>
              <li className="flex items-center gap-8">
                <svg width="34" height="10" aria-hidden="true" className="shrink-0">
                  <line x1="0" y1="5" x2="34" y2="5" stroke="#0B1220" strokeWidth="1.5" />
                </svg>
                <span className="whitespace-normal">Assignment edge (solid)</span>
              </li>
              <li className="flex items-center gap-8">
                <StateMarker tone="danger" glyph="⚠" label="Deadlock cycle" />
              </li>
              <li className="flex items-center gap-8">
                <StateMarker tone="warning" glyph="…" label="Waiting" />
              </li>
              <li className="flex items-center gap-8">
                <StateMarker tone="success" glyph="✓" label="Safe / free" />
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Empty state */}
      {scenario.processes.length === 0 && scenario.resources.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="panel p-24 text-center max-w-[360px]">
            <p className="font-semibold text-ink-black mb-8">The canvas is empty</p>
            <p className="text-body-sm text-graphite">
              Add processes and resources from the builder, or load one of the preset scenarios.
            </p>
          </div>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {detection
          ? detection.hasDeadlock
            ? `Deadlock detected among ${detection.deadlockedProcessIds.join(', ')}`
            : 'No deadlock detected'
          : 'No detection has been run yet'}
      </span>
    </div>
  );
}
