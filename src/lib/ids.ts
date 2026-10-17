import { Process, Resource } from '../engine/types';

/** Returns the next free `P{n}` identifier. */
export function nextProcessId(processes: Process[]): string {
  let max = -1;
  for (const p of processes) {
    const m = /^P(\d+)$/.exec(p.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `P${max + 1}`;
}

/** Returns the next free `R{n}` identifier. */
export function nextResourceId(resources: Resource[]): string {
  let max = -1;
  for (const r of resources) {
    const m = /^R(\d+)$/.exec(r.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `R${max + 1}`;
}

export function requestEdgeId(processId: string, resourceId: string): string {
  return `req-${processId}-${resourceId}`;
}

export function assignmentEdgeId(resourceId: string, processId: string): string {
  return `alloc-${resourceId}-${processId}`;
}
