/**
 * DeadlockLab Engine Core Types
 * Pure TypeScript - Zero React / DOM dependencies.
 */

export class EngineError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(`[EngineError: ${code}] ${message}`);
    this.name = 'EngineError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, EngineError.prototype);
  }
}

export interface Process {
  id: string; // e.g. "P0", "P1"
  name: string;
}

export interface Resource {
  id: string; // e.g. "R0", "R1"
  name: string;
  totalInstances: number; // 1 to 10
}

export type EdgeType = 'request' | 'assignment';

export interface Edge {
  id: string; // e.g. "P0->R1" or "R1->P0"
  type: EdgeType;
  from: string; // Process ID or Resource ID
  to: string;   // Resource ID or Process ID
  count: number; // Number of instances requested or assigned
}

export interface SystemState {
  processes: Process[];
  resources: Resource[];
  edges: Edge[];
  // Optional matrices for multi-instance / Banker's representation
  // allocation[pIndex][rIndex]
  allocation?: number[][];
  max?: number[][];
  need?: number[][];
  request?: number[][];
  available?: number[];
}

export interface StepHighlight {
  nodeIds?: string[];
  edgeIds?: string[];
  matrixCells?: Array<{ row: number; col: number; matrix: 'allocation' | 'max' | 'need' | 'request' | 'available' | 'work' }>;
  type?: 'neutral' | 'active' | 'success' | 'warning' | 'danger';
}

export interface Step {
  id: string;
  title: string;
  explanation: string;
  pseudocodeLine?: number;
  highlight?: StepHighlight;
  snapshot: SystemState;
  metadata?: Record<string, unknown>;
}

export interface TraceResult<T> {
  result: T;
  steps: Step[];
}

// Detection Types
export interface DetectionResult {
  hasDeadlock: boolean;
  deadlockedProcessIds: string[];
  cycleMemberIds: string[]; // Processes forming wait cycles
  cycles: string[][];       // e.g. [["P1", "P2", "P1"]]
  algorithmUsed: 'single-instance-wfg' | 'multi-instance-matrix';
  coffmanStatus: {
    mutualExclusion: boolean;
    holdAndWait: boolean;
    noPreemption: boolean;
    circularWait: boolean;
    reasons: {
      mutualExclusion: string;
      holdAndWait: string;
      noPreemption: string;
      circularWait: string;
    };
  };
}

// Banker's Types
export interface BankersSafetyResult {
  isSafe: boolean;
  safeSequence?: string[];
  workMatrixTimeline?: number[][];
}

export type ResourceRequestOutcome = 'GRANTED' | 'DENIED_UNSAFE' | 'WAIT_UNAVAILABLE' | 'ERROR_EXCEEDS_NEED';

export interface BankersRequestResult {
  outcome: ResourceRequestOutcome;
  message: string;
  safetyResult?: BankersSafetyResult;
  updatedState?: SystemState;
}

// Recovery Types
export type RecoveryStrategy = 'TERMINATE_ALL' | 'TERMINATE_VICTIM' | 'PREEMPT_RESOURCE';

export interface RecoveryAction {
  strategy: RecoveryStrategy;
  victimProcessId?: string;
  preemptedResourceId?: string;
  preemptedCount?: number;
}

export interface RecoveryResult {
  actionTaken: RecoveryAction;
  priorState: SystemState;
  newState: SystemState;
  resolved: boolean;
  postDetection: DetectionResult;
}

// Simulator Types
export type ProcessExecutionState = 'Ready' | 'Running' | 'Waiting' | 'Finished' | 'Deadlocked';

export type SimulatorScriptCommand =
  | { type: 'request'; resourceId: string; count: number }
  | { type: 'release'; resourceId: string; count: number }
  | { type: 'compute'; duration: number };

export interface ProcessScript {
  processId: string;
  instructions: SimulatorScriptCommand[];
}

export interface PreventionPolicies {
  breakHoldAndWait: boolean;       // Atomic allocation: all or nothing
  breakNoPreemption: boolean;      // If blocked, release held resources or preempt
  breakCircularWait: boolean;      // Strict resource index ordering R0 < R1 < ...
}

export interface SimulatorTickEvent {
  tick: number;
  processId: string;
  action: string;
  outcome: 'granted' | 'blocked' | 'released' | 'computed' | 'finished' | 'rejected_policy';
  policyNotice?: {
    policy: string;
    rule: string;
    coffmanCondition: string;
  };
}
