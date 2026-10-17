/**
 * Deterministic auto-layout for the RAG canvas.
 * Processes form the left column, resources the right column.
 */
import { SystemState } from '../engine/types';

export interface NodePosition {
  x: number;
  y: number;
}

export type Positions = Record<string, NodePosition>;

export const CANVAS_WIDTH = 820;
export const CANVAS_HEIGHT = 560;

export function autoLayout(state: SystemState): Positions {
  const positions: Positions = {};

  const leftX = 170;
  const rightX = CANVAS_WIDTH - 170;

  const layoutColumn = (count: number): number[] => {
    if (count === 0) return [];
    const top = 70;
    const bottom = CANVAS_HEIGHT - 70;
    if (count === 1) return [(top + bottom) / 2];
    const step = (bottom - top) / (count - 1);
    return Array.from({ length: count }, (_, i) => top + step * i);
  };

  const processYs = layoutColumn(state.processes.length);
  state.processes.forEach((p, i) => {
    positions[p.id] = { x: leftX, y: processYs[i] ?? CANVAS_HEIGHT / 2 };
  });

  const resourceYs = layoutColumn(state.resources.length);
  state.resources.forEach((r, i) => {
    positions[r.id] = { x: rightX, y: resourceYs[i] ?? CANVAS_HEIGHT / 2 };
  });

  return positions;
}

/** Ensures every node has a position, filling gaps without disturbing existing ones. */
export function ensurePositions(state: SystemState, existing: Positions): Positions {
  const next: Positions = { ...existing };
  const fallback = autoLayout(state);
  for (const p of state.processes) {
    if (!next[p.id]) next[p.id] = fallback[p.id] ?? { x: 170, y: CANVAS_HEIGHT / 2 };
  }
  for (const r of state.resources) {
    if (!next[r.id]) next[r.id] = fallback[r.id] ?? { x: CANVAS_WIDTH - 170, y: CANVAS_HEIGHT / 2 };
  }
  // Drop positions of removed nodes
  const validIds = new Set([...state.processes.map((p) => p.id), ...state.resources.map((r) => r.id)]);
  for (const id of Object.keys(next)) {
    if (!validIds.has(id)) delete next[id];
  }
  return next;
}
