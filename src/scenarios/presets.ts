/**
 * Preset Scenarios for DeadlockLab.
 * Includes T1-T8 scenarios and comprehensive standard configurations.
 */
import { SystemState } from '../engine/types';

// Preset 1: T1 - Classic 2-Process Deadlock
export const presetClassicDeadlock: SystemState = {
  processes: [
    { id: 'P1', name: 'Process 1' },
    { id: 'P2', name: 'Process 2' },
  ],
  resources: [
    { id: 'R1', name: 'Resource 1', totalInstances: 1 },
    { id: 'R2', name: 'Resource 2', totalInstances: 1 },
  ],
  edges: [
    { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
    { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
    { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
    { id: 'e4', type: 'request', from: 'P2', to: 'R1', count: 1 },
  ],
};

// Preset 2: T2 - Safe System / Linear Chain
export const presetSafeChain: SystemState = {
  processes: [
    { id: 'P1', name: 'Process 1' },
    { id: 'P2', name: 'Process 2' },
  ],
  resources: [
    { id: 'R1', name: 'Resource 1', totalInstances: 1 },
    { id: 'R2', name: 'Resource 2', totalInstances: 1 },
  ],
  edges: [
    { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
    { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
    { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
  ],
};

// Preset 3: 3-Process Circular Wait
export const preset3ProcessCircularWait: SystemState = {
  processes: [
    { id: 'P1', name: 'Process 1' },
    { id: 'P2', name: 'Process 2' },
    { id: 'P3', name: 'Process 3' },
  ],
  resources: [
    { id: 'R1', name: 'Resource 1', totalInstances: 1 },
    { id: 'R2', name: 'Resource 2', totalInstances: 1 },
    { id: 'R3', name: 'Resource 3', totalInstances: 1 },
  ],
  edges: [
    { id: 'e1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
    { id: 'e2', type: 'request', from: 'P1', to: 'R2', count: 1 },
    { id: 'e3', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
    { id: 'e4', type: 'request', from: 'P2', to: 'R3', count: 1 },
    { id: 'e5', type: 'assignment', from: 'R3', to: 'P3', count: 1 },
    { id: 'e6', type: 'request', from: 'P3', to: 'R1', count: 1 },
  ],
};

// Preset 4: T3 - Multi-Instance Banker's Safe State
export const presetBankersSafe: SystemState = {
  processes: [
    { id: 'P0', name: 'Process 0' },
    { id: 'P1', name: 'Process 1' },
    { id: 'P2', name: 'Process 2' },
    { id: 'P3', name: 'Process 3' },
    { id: 'P4', name: 'Process 4' },
  ],
  resources: [
    { id: 'R0', name: 'Resource A', totalInstances: 10 },
    { id: 'R1', name: 'Resource B', totalInstances: 5 },
    { id: 'R2', name: 'Resource C', totalInstances: 7 },
  ],
  edges: [
    // P0: Alloc [0, 1, 0]
    { id: 'e_a_P0_R1', type: 'assignment', from: 'R1', to: 'P0', count: 1 },
    // P1: Alloc [2, 0, 0]
    { id: 'e_a_P1_R0', type: 'assignment', from: 'R0', to: 'P1', count: 2 },
    // P2: Alloc [3, 0, 2]
    { id: 'e_a_P2_R0', type: 'assignment', from: 'R0', to: 'P2', count: 3 },
    { id: 'e_a_P2_R2', type: 'assignment', from: 'R2', to: 'P2', count: 2 },
    // P3: Alloc [2, 1, 1]
    { id: 'e_a_P3_R0', type: 'assignment', from: 'R0', to: 'P3', count: 2 },
    { id: 'e_a_P3_R1', type: 'assignment', from: 'R1', to: 'P3', count: 1 },
    { id: 'e_a_P3_R2', type: 'assignment', from: 'R2', to: 'P3', count: 1 },
    // P4: Alloc [0, 0, 2]
    { id: 'e_a_P4_R2', type: 'assignment', from: 'R2', to: 'P4', count: 2 },
  ],
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  need: [
    [7, 4, 3],
    [1, 2, 2],
    [6, 0, 0],
    [0, 1, 1],
    [4, 3, 1],
  ],
  available: [3, 3, 2],
};

// Preset 5: T4 - Multi-Instance Safe Detection
export const presetMultiInstanceSafe: SystemState = {
  processes: [
    { id: 'P0', name: 'Process 0' },
    { id: 'P1', name: 'Process 1' },
    { id: 'P2', name: 'Process 2' },
    { id: 'P3', name: 'Process 3' },
    { id: 'P4', name: 'Process 4' },
  ],
  resources: [
    { id: 'R0', name: 'Resource A', totalInstances: 7 },
    { id: 'R1', name: 'Resource B', totalInstances: 2 },
    { id: 'R2', name: 'Resource C', totalInstances: 6 },
  ],
  edges: [
    // Allocations: Sum = [7, 2, 6], leaving Available = [0, 0, 0]
    { id: 'e_a_P0_R1', type: 'assignment', from: 'R1', to: 'P0', count: 1 },
    { id: 'e_a_P1_R0', type: 'assignment', from: 'R0', to: 'P1', count: 2 },
    { id: 'e_a_P2_R0', type: 'assignment', from: 'R0', to: 'P2', count: 3 },
    { id: 'e_a_P2_R2', type: 'assignment', from: 'R2', to: 'P2', count: 3 },
    { id: 'e_a_P3_R0', type: 'assignment', from: 'R0', to: 'P3', count: 2 },
    { id: 'e_a_P3_R1', type: 'assignment', from: 'R1', to: 'P3', count: 1 },
    { id: 'e_a_P3_R2', type: 'assignment', from: 'R2', to: 'P3', count: 1 },
    { id: 'e_a_P4_R2', type: 'assignment', from: 'R2', to: 'P4', count: 2 },

    // Requests:
    { id: 'e_r_P1_R0', type: 'request', from: 'P1', to: 'R0', count: 2 },
    { id: 'e_r_P1_R2', type: 'request', from: 'P1', to: 'R2', count: 2 },
    { id: 'e_r_P3_R0', type: 'request', from: 'P3', to: 'R0', count: 1 },
    { id: 'e_r_P4_R2', type: 'request', from: 'P4', to: 'R2', count: 2 },
  ],
};

// Preset 6: T5 - Multi-Instance Deadlock (T4 with P2 requesting [0, 0, 1])
export const presetMultiInstanceDeadlock: SystemState = {
  processes: [
    { id: 'P0', name: 'Process 0' },
    { id: 'P1', name: 'Process 1' },
    { id: 'P2', name: 'Process 2' },
    { id: 'P3', name: 'Process 3' },
    { id: 'P4', name: 'Process 4' },
  ],
  resources: [
    { id: 'R0', name: 'Resource A', totalInstances: 7 },
    { id: 'R1', name: 'Resource B', totalInstances: 2 },
    { id: 'R2', name: 'Resource C', totalInstances: 6 },
  ],
  edges: [
    // Allocations
    { id: 'e_a_P0_R1', type: 'assignment', from: 'R1', to: 'P0', count: 1 },
    { id: 'e_a_P1_R0', type: 'assignment', from: 'R0', to: 'P1', count: 2 },
    { id: 'e_a_P2_R0', type: 'assignment', from: 'R0', to: 'P2', count: 3 },
    { id: 'e_a_P2_R2', type: 'assignment', from: 'R2', to: 'P2', count: 3 },
    { id: 'e_a_P3_R0', type: 'assignment', from: 'R0', to: 'P3', count: 2 },
    { id: 'e_a_P3_R1', type: 'assignment', from: 'R1', to: 'P3', count: 1 },
    { id: 'e_a_P3_R2', type: 'assignment', from: 'R2', to: 'P3', count: 1 },
    { id: 'e_a_P4_R2', type: 'assignment', from: 'R2', to: 'P4', count: 2 },

    // Requests:
    { id: 'e_r_P1_R0', type: 'request', from: 'P1', to: 'R0', count: 2 },
    { id: 'e_r_P1_R2', type: 'request', from: 'P1', to: 'R2', count: 2 },
    { id: 'e_r_P2_R2', type: 'request', from: 'P2', to: 'R2', count: 1 }, // P2 requests R2
    { id: 'e_r_P3_R0', type: 'request', from: 'P3', to: 'R0', count: 1 },
    { id: 'e_r_P4_R2', type: 'request', from: 'P4', to: 'R2', count: 2 },
  ],
};

// Preset 7: T8 - Dining Philosophers (5)
export const presetDiningPhilosophers: SystemState = {
  processes: [
    { id: 'P0', name: 'Philosopher 0' },
    { id: 'P1', name: 'Philosopher 1' },
    { id: 'P2', name: 'Philosopher 2' },
    { id: 'P3', name: 'Philosopher 3' },
    { id: 'P4', name: 'Philosopher 4' },
  ],
  resources: [
    { id: 'R0', name: 'Fork 0', totalInstances: 1 },
    { id: 'R1', name: 'Fork 1', totalInstances: 1 },
    { id: 'R2', name: 'Fork 2', totalInstances: 1 },
    { id: 'R3', name: 'Fork 3', totalInstances: 1 },
    { id: 'R4', name: 'Fork 4', totalInstances: 1 },
  ],
  edges: [
    // Each philosopher i holds Fork i and requests Fork (i+1)%5
    { id: 'dp_a_0', type: 'assignment', from: 'R0', to: 'P0', count: 1 },
    { id: 'dp_r_0', type: 'request', from: 'P0', to: 'R1', count: 1 },

    { id: 'dp_a_1', type: 'assignment', from: 'R1', to: 'P1', count: 1 },
    { id: 'dp_r_1', type: 'request', from: 'P1', to: 'R2', count: 1 },

    { id: 'dp_a_2', type: 'assignment', from: 'R2', to: 'P2', count: 1 },
    { id: 'dp_r_2', type: 'request', from: 'P2', to: 'R3', count: 1 },

    { id: 'dp_a_3', type: 'assignment', from: 'R3', to: 'P3', count: 1 },
    { id: 'dp_r_3', type: 'request', from: 'P3', to: 'R4', count: 1 },

    { id: 'dp_a_4', type: 'assignment', from: 'R4', to: 'P4', count: 1 },
    { id: 'dp_r_4', type: 'request', from: 'P4', to: 'R0', count: 1 },
  ],
};

export const PRESETS: Record<string, { name: string; description: string; state: SystemState }> = {
  'classic-deadlock': {
    name: 'Classic 2-Process Deadlock',
    description: 'P1 holds R1 requesting R2; P2 holds R2 requesting R1.',
    state: presetClassicDeadlock,
  },
  'safe-chain': {
    name: 'Safe System (Chain)',
    description: 'P1 holds R1 requesting R2; P2 holds R2 with no requests.',
    state: presetSafeChain,
  },
  'circular-wait-3': {
    name: '3-Process Circular Wait',
    description: 'Triangular circular dependency loop between P1, P2, and P3.',
    state: preset3ProcessCircularWait,
  },
  'bankers-safe': {
    name: "Banker's Safe State (T3)",
    description: 'Classic 5-process 3-resource safe state from Silberschatz OS textbook.',
    state: presetBankersSafe,
  },
  'multi-safe': {
    name: 'Multi-Instance Safe (T4)',
    description: 'Multiple resource instances with zero initial available, solvable sequence.',
    state: presetMultiInstanceSafe,
  },
  'multi-deadlock': {
    name: 'Multi-Instance Deadlock (T5)',
    description: 'Multi-instance system where P2 holds and requests causing deadlock for {P1, P2, P3, P4}.',
    state: presetMultiInstanceDeadlock,
  },
  'dining-philosophers': {
    name: 'Dining Philosophers (5)',
    description: '5 philosophers holding left fork and waiting on right fork.',
    state: presetDiningPhilosophers,
  },
};
