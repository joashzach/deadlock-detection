import { SystemState, Edge } from '../engine/types';
import { assignmentEdgeId, requestEdgeId } from './ids';

/** splitmix32 — small, fast, deterministic PRNG. */
export function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a deterministic, schema-valid random scenario.
 * Allocations never exceed capacity and no duplicate edges are produced.
 */
export function generateRandomScenario(seed: number): SystemState {
  const rng = splitmix32(seed);
  const pCount = 2 + Math.floor(rng() * 5); // 2..6
  const rCount = 2 + Math.floor(rng() * 5); // 2..6

  const processes = Array.from({ length: pCount }, (_, i) => ({ id: `P${i}`, name: `Process ${i}` }));
  const resources = Array.from({ length: rCount }, (_, j) => ({
    id: `R${j}`,
    name: `Resource ${j}`,
    totalInstances: 1 + Math.floor(rng() * 3), // 1..3
  }));

  const edges: Edge[] = [];
  const remaining = new Map(resources.map((r) => [r.id, r.totalInstances]));

  // Assignments: give some resources to some processes without oversubscribing.
  for (const resource of resources) {
    if (rng() < 0.75) {
      const process = processes[Math.floor(rng() * pCount)]!;
      const free = remaining.get(resource.id) ?? 0;
      const take = 1 + Math.floor(rng() * free);
      if (take > 0) {
        edges.push({
          id: assignmentEdgeId(resource.id, process.id),
          type: 'assignment',
          from: resource.id,
          to: process.id,
          count: take,
        });
        remaining.set(resource.id, free - take);
      }
    }
  }

  // Requests: a process may request a resource it does not already hold.
  for (const process of processes) {
    for (const resource of resources) {
      const holds = edges.some(
        (e) => e.type === 'assignment' && e.from === resource.id && e.to === process.id
      );
      const alreadyRequested = edges.some(
        (e) => e.type === 'request' && e.from === process.id && e.to === resource.id
      );
      if (!holds && !alreadyRequested && rng() < 0.3) {
        edges.push({
          id: requestEdgeId(process.id, resource.id),
          type: 'request',
          from: process.id,
          to: resource.id,
          count: 1,
        });
      }
    }
  }

  return { processes, resources, edges };
}
