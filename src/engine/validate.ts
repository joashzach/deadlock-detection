/**
 * Scenario and State Validation
 */
import { SystemState, EngineError, Edge } from './types';

export const MAX_PROCESSES = 20;
export const MAX_RESOURCES = 20;
export const MIN_INSTANCES = 1;
export const MAX_INSTANCES = 10;

export function cloneSystemState(state: SystemState): SystemState {
  return structuredClone(state);
}

export function validateSystemState(state: SystemState): void {
  if (!state) {
    throw new EngineError('INVALID_STATE', 'System state must be defined');
  }

  const { processes, resources, edges } = state;

  if (!Array.isArray(processes)) {
    throw new EngineError('INVALID_PROCESSES', 'Processes must be an array');
  }

  if (!Array.isArray(resources)) {
    throw new EngineError('INVALID_RESOURCES', 'Resources must be an array');
  }

  if (!Array.isArray(edges)) {
    throw new EngineError('INVALID_EDGES', 'Edges must be an array');
  }

  if (processes.length > MAX_PROCESSES) {
    throw new EngineError(
      'PROCESS_LIMIT_EXCEEDED',
      `Number of processes (${processes.length}) exceeds maximum limit of ${MAX_PROCESSES}`
    );
  }

  if (resources.length > MAX_RESOURCES) {
    throw new EngineError(
      'RESOURCE_LIMIT_EXCEEDED',
      `Number of resources (${resources.length}) exceeds maximum limit of ${MAX_RESOURCES}`
    );
  }

  // Validate unique IDs
  const processIds = new Set<string>();
  for (const p of processes) {
    if (!p.id || typeof p.id !== 'string') {
      throw new EngineError('INVALID_PROCESS_ID', 'Process ID must be a non-empty string');
    }
    if (processIds.has(p.id)) {
      throw new EngineError('DUPLICATE_PROCESS_ID', `Duplicate process ID: ${p.id}`);
    }
    processIds.add(p.id);
  }

  const resourceIds = new Set<string>();
  for (const r of resources) {
    if (!r.id || typeof r.id !== 'string') {
      throw new EngineError('INVALID_RESOURCE_ID', 'Resource ID must be a non-empty string');
    }
    if (resourceIds.has(r.id)) {
      throw new EngineError('DUPLICATE_RESOURCE_ID', `Duplicate resource ID: ${r.id}`);
    }
    if (
      typeof r.totalInstances !== 'number' ||
      !Number.isInteger(r.totalInstances) ||
      r.totalInstances < MIN_INSTANCES ||
      r.totalInstances > MAX_INSTANCES
    ) {
      throw new EngineError(
        'INVALID_INSTANCE_COUNT',
        `Resource ${r.id} instances must be an integer between ${MIN_INSTANCES} and ${MAX_INSTANCES}`
      );
    }
    resourceIds.add(r.id);
  }

  // Track allocation totals per resource
  const allocatedTotals = new Map<string, number>();
  for (const r of resources) {
    allocatedTotals.set(r.id, 0);
  }

  // Track seen edges for duplicate edge checks
  const edgeKeys = new Set<string>();

  for (const e of edges) {
    if (!e.id || typeof e.id !== 'string') {
      throw new EngineError('INVALID_EDGE_ID', 'Edge ID must be a non-empty string');
    }
    if (edgeKeys.has(`${e.from}->${e.to}`)) {
      throw new EngineError('DUPLICATE_EDGE', `Duplicate edge between ${e.from} and ${e.to}`);
    }
    edgeKeys.add(`${e.from}->${e.to}`);

    if (e.count <= 0 || !Number.isInteger(e.count)) {
      throw new EngineError('INVALID_EDGE_COUNT', `Edge ${e.id} count must be a positive integer`);
    }

    if (e.type === 'assignment') {
      // Assignment edge: Resource -> Process
      if (!resourceIds.has(e.from)) {
        throw new EngineError(
          'INVALID_ASSIGNMENT_SOURCE',
          `Assignment edge source ${e.from} is not a valid resource`
        );
      }
      if (!processIds.has(e.to)) {
        throw new EngineError(
          'INVALID_ASSIGNMENT_TARGET',
          `Assignment edge target ${e.to} is not a valid process`
        );
      }

      const res = resources.find((r) => r.id === e.from)!;
      const currentAlloc = (allocatedTotals.get(e.from) ?? 0) + e.count;
      if (currentAlloc > res.totalInstances) {
        throw new EngineError(
          'ALLOCATION_EXCEEDS_TOTAL',
          `Total allocations for resource ${res.id} (${currentAlloc}) exceed capacity (${res.totalInstances})`
        );
      }
      allocatedTotals.set(e.from, currentAlloc);
    } else if (e.type === 'request') {
      // Request edge: Process -> Resource
      if (!processIds.has(e.from)) {
        throw new EngineError(
          'INVALID_REQUEST_SOURCE',
          `Request edge source ${e.from} is not a valid process`
        );
      }
      if (!resourceIds.has(e.to)) {
        throw new EngineError(
          'INVALID_REQUEST_TARGET',
          `Request edge target ${e.to} is not a valid resource`
        );
      }
    } else {
      throw new EngineError('INVALID_EDGE_TYPE', `Unknown edge type: ${(e as Edge).type}`);
    }
  }

  // If matrices are present, validate consistency
  if (state.allocation && state.request) {
    validateMatrices(state);
  }
}

export function validateMatrices(state: SystemState): void {
  const { processes, resources, allocation, max, need, available } = state;
  const pCount = processes.length;
  const rCount = resources.length;

  if (allocation) {
    if (allocation.length !== pCount) {
      throw new EngineError(
        'MATRIX_DIMENSION_MISMATCH',
        `Allocation rows (${allocation.length}) != processes (${pCount})`
      );
    }
    for (let i = 0; i < pCount; i++) {
      const row = allocation[i]!;
      if (row.length !== rCount) {
        throw new EngineError(
          'MATRIX_DIMENSION_MISMATCH',
          `Allocation col count (${row.length}) != resources (${rCount})`
        );
      }
      for (let j = 0; j < rCount; j++) {
        const val = row[j]!;
        if (val < 0 || !Number.isInteger(val)) {
          throw new EngineError('NEGATIVE_MATRIX_VALUE', `Allocation at [${i}][${j}] must be non-negative integer`);
        }
      }
    }
  }

  if (max) {
    if (max.length !== pCount) {
      throw new EngineError('MATRIX_DIMENSION_MISMATCH', `Max rows (${max.length}) != processes (${pCount})`);
    }
    for (let i = 0; i < pCount; i++) {
      const row = max[i]!;
      if (row.length !== rCount) {
        throw new EngineError('MATRIX_DIMENSION_MISMATCH', `Max col count (${row.length}) != resources (${rCount})`);
      }
      for (let j = 0; j < rCount; j++) {
        const val = row[j]!;
        if (val < 0 || !Number.isInteger(val)) {
          throw new EngineError('NEGATIVE_MATRIX_VALUE', `Max at [${i}][${j}] must be non-negative integer`);
        }
        if (allocation && allocation[i]![j]! > val) {
          throw new EngineError(
            'ALLOCATION_EXCEEDS_MAX',
            `Allocation [${i}][${j}] (${allocation[i]![j]}) exceeds Max (${val})`
          );
        }
      }
    }
  }

  if (need && max && allocation) {
    for (let i = 0; i < pCount; i++) {
      for (let j = 0; j < rCount; j++) {
        const expectedNeed = max[i]![j]! - allocation[i]![j]!;
        if (need[i]![j]! !== expectedNeed) {
          throw new EngineError(
            'NEED_MATRIX_INCONSISTENT',
            `Need [${i}][${j}] (${need[i]![j]}) != Max (${max[i]![j]}) - Alloc (${allocation[i]![j]})`
          );
        }
      }
    }
  }

  if (available) {
    if (available.length !== rCount) {
      throw new EngineError('MATRIX_DIMENSION_MISMATCH', `Available length (${available.length}) != resources (${rCount})`);
    }
    for (let j = 0; j < rCount; j++) {
      let sumAlloc = 0;
      if (allocation) {
        for (let i = 0; i < pCount; i++) {
          sumAlloc += allocation[i]![j]!;
        }
      }
      const total = resources[j]!.totalInstances;
      if (available[j]! !== total - sumAlloc) {
        throw new EngineError(
          'AVAILABLE_INCONSISTENT',
          `Available for resource ${resources[j]!.id} is ${available[j]}, expected ${total - sumAlloc}`
        );
      }
    }
  }
}
