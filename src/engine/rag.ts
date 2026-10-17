/**
 * Resource Allocation Graph (RAG) and Wait-For Graph (WFG) utilities.
 */
import { SystemState, Edge } from './types';
import { validateSystemState } from './validate';

export interface WFGEdge {
  from: string; // Waiting process
  to: string;   // Process holding the resource
  viaResource: string;
  count: number;
}

export interface WFGGraph {
  processIds: string[];
  edges: WFGEdge[];
  adjacency: Map<string, string[]>;
}

/**
 * Derives matrices (Allocation, Request, Available) from RAG graph structure.
 */
export function deriveMatricesFromRAG(state: SystemState): {
  allocation: number[][];
  request: number[][];
  available: number[];
  max?: number[][];
  need?: number[][];
} {
  validateSystemState(state);

  const pIndexMap = new Map<string, number>();
  state.processes.forEach((p, idx) => pIndexMap.set(p.id, idx));

  const rIndexMap = new Map<string, number>();
  state.resources.forEach((r, idx) => rIndexMap.set(r.id, idx));

  const pCount = state.processes.length;
  const rCount = state.resources.length;

  const allocation: number[][] = Array.from({ length: pCount }, () => Array(rCount).fill(0));
  const request: number[][] = Array.from({ length: pCount }, () => Array(rCount).fill(0));
  const available: number[] = state.resources.map((r) => r.totalInstances);

  for (const edge of state.edges) {
    if (edge.type === 'assignment') {
      const rIdx = rIndexMap.get(edge.from);
      const pIdx = pIndexMap.get(edge.to);
      if (rIdx !== undefined && pIdx !== undefined) {
        allocation[pIdx]![rIdx]! += edge.count;
        available[rIdx]! -= edge.count;
      }
    } else if (edge.type === 'request') {
      const pIdx = pIndexMap.get(edge.from);
      const rIdx = rIndexMap.get(edge.to);
      if (pIdx !== undefined && rIdx !== undefined) {
        request[pIdx]![rIdx]! += edge.count;
      }
    }
  }

  // Preserve max and need if already present and consistent, otherwise default Max = Alloc + Request
  let max = state.max;
  let need = state.need;

  if (!max) {
    max = Array.from({ length: pCount }, (_, i) =>
      Array.from({ length: rCount }, (_, j) => allocation[i]![j]! + request[i]![j]!)
    );
  }

  if (!need) {
    need = Array.from({ length: pCount }, (_, i) =>
      Array.from({ length: rCount }, (_, j) => Math.max(0, max![i]![j]! - allocation[i]![j]!))
    );
  }

  return { allocation, request, available, max, need };
}

/**
 * Builds RAG edges from explicit matrices.
 */
export function buildEdgesFromMatrices(
  processes: SystemState['processes'],
  resources: SystemState['resources'],
  allocation: number[][],
  request: number[][]
): Edge[] {
  const edges: Edge[] = [];

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i]!;
    for (let j = 0; j < resources.length; j++) {
      const r = resources[j]!;
      const allocCount = allocation[i]?.[j] ?? 0;
      if (allocCount > 0) {
        edges.push({
          id: `alloc-${r.id}-${p.id}`,
          type: 'assignment',
          from: r.id,
          to: p.id,
          count: allocCount,
        });
      }

      const reqCount = request[i]?.[j] ?? 0;
      if (reqCount > 0) {
        edges.push({
          id: `req-${p.id}-${r.id}`,
          type: 'request',
          from: p.id,
          to: r.id,
          count: reqCount,
        });
      }
    }
  }

  return edges;
}

/**
 * Converts RAG to WFG (Wait-For Graph).
 * A process Pi waits for Pj if Pi requests a resource R that is currently allocated to Pj.
 * Strictly applicable to single-instance resources, but cleanly models dependencies.
 */
export function convertRAGtoWFG(state: SystemState): WFGGraph {
  validateSystemState(state);

  const processIds = state.processes.map((p) => p.id);
  const edges: WFGEdge[] = [];
  const adjacency = new Map<string, string[]>();

  for (const pid of processIds) {
    adjacency.set(pid, []);
  }

  // Find holders for each resource
  const resourceHolders = new Map<string, Array<{ processId: string; count: number }>>();
  for (const res of state.resources) {
    resourceHolders.set(res.id, []);
  }

  for (const edge of state.edges) {
    if (edge.type === 'assignment') {
      const holders = resourceHolders.get(edge.from);
      if (holders) {
        holders.push({ processId: edge.to, count: edge.count });
      }
    }
  }

  // For each request edge (Pi -> R), Pi waits for all processes holding R
  for (const edge of state.edges) {
    if (edge.type === 'request') {
      const requester = edge.from;
      const resId = edge.to;
      const holders = resourceHolders.get(resId) || [];

      for (const holder of holders) {
        if (holder.processId !== requester) {
          edges.push({
            from: requester,
            to: holder.processId,
            viaResource: resId,
            count: edge.count,
          });

          const currentAdj = adjacency.get(requester) ?? [];
          if (!currentAdj.includes(holder.processId)) {
            currentAdj.push(holder.processId);
            adjacency.set(requester, currentAdj);
          }
        }
      }
    }
  }

  return {
    processIds,
    edges,
    adjacency,
  };
}
