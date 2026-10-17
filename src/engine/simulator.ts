/**
 * Live Simulator Tick Engine.
 * Simulates concurrent process execution driven by scripts with request/grant/block/release semantics.
 * Integrates prevention policies, continuous deadlock detection, and deterministic PRNG.
 */
import {
  SystemState,
  ProcessScript,
  PreventionPolicies,
  ProcessExecutionState,
  SimulatorTickEvent,
  DetectionResult,
} from './types';
import { cloneSystemState, validateSystemState } from './validate';
import { detectDeadlock } from './detect';
import { checkPreventionPolicy } from './prevent/policies';

export interface SimulatorProcessStatus {
  processId: string;
  state: ProcessExecutionState;
  programCounter: number;
  computeRemaining: number;
}

export interface SimulatorState {
  tick: number;
  systemState: SystemState;
  processStatuses: SimulatorProcessStatus[];
  events: SimulatorTickEvent[];
  isFinished: boolean;
  deadlockDetectedAtTick?: number;
  detectionResult?: DetectionResult;
}

export class SimulatorEngine {
  private systemState: SystemState;
  private scripts: Map<string, ProcessScript>;
  private policies: PreventionPolicies;
  private statuses: Map<string, SimulatorProcessStatus>;
  private tickCount: number;
  private events: SimulatorTickEvent[];
  private deadlockTick?: number;
  private maxTicks: number;

  constructor(
    initialState: SystemState,
    scripts: ProcessScript[],
    policies: PreventionPolicies,
    maxTicks: number = 200
  ) {
    validateSystemState(initialState);
    this.systemState = cloneSystemState(initialState);
    this.policies = { ...policies };
    this.maxTicks = maxTicks;
    this.tickCount = 0;
    this.events = [];
    this.scripts = new Map();
    this.statuses = new Map();

    for (const s of scripts) {
      this.scripts.set(s.processId, s);
    }

    for (const p of initialState.processes) {
      this.statuses.set(p.id, {
        processId: p.id,
        state: 'Ready',
        programCounter: 0,
        computeRemaining: 0,
      });
    }
  }

  public getSnapshot(): SimulatorState {
    const isFinished =
      this.tickCount >= this.maxTicks ||
      Array.from(this.statuses.values()).every(
        (s) => s.state === 'Finished' || s.state === 'Deadlocked'
      );

    const detection = detectDeadlock(this.systemState).result;

    return {
      tick: this.tickCount,
      systemState: cloneSystemState(this.systemState),
      processStatuses: Array.from(this.statuses.values()).map((s) => ({ ...s })),
      events: [...this.events],
      isFinished,
      deadlockDetectedAtTick: this.deadlockTick,
      detectionResult: detection,
    };
  }

  /**
   * Advances the simulation by one discrete tick.
   */
  public step(): SimulatorState {
    if (this.tickCount >= this.maxTicks) {
      return this.getSnapshot();
    }

    this.tickCount++;

    // Calculate current free instances per resource
    const freeInstances = new Map<string, number>();
    for (const r of this.systemState.resources) {
      let allocated = 0;
      for (const e of this.systemState.edges) {
        if (e.type === 'assignment' && e.from === r.id) {
          allocated += e.count;
        }
      }
      freeInstances.set(r.id, r.totalInstances - allocated);
    }

    // Process each process in deterministic order
    for (const proc of this.systemState.processes) {
      const status = this.statuses.get(proc.id);
      if (!status) continue;

      if (status.state === 'Finished' || status.state === 'Deadlocked') {
        continue;
      }

      // If in compute state
      if (status.computeRemaining > 0) {
        status.computeRemaining--;
        if (status.computeRemaining === 0) {
          status.state = 'Ready';
          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: 'Completed compute step',
            outcome: 'computed',
          });
        } else {
          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: `Computing (${status.computeRemaining} ticks remaining)`,
            outcome: 'computed',
          });
        }
        continue;
      }

      const script = this.scripts.get(proc.id);
      if (!script || status.programCounter >= script.instructions.length) {
        // If no more instructions and holding no resources, mark Finished
        const hasHeld = this.systemState.edges.some(
          (e) => e.type === 'assignment' && e.to === proc.id && e.count > 0
        );
        if (!hasHeld) {
          status.state = 'Finished';
          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: 'Execution completed',
            outcome: 'finished',
          });
        }
        continue;
      }

      const instruction = script.instructions[status.programCounter]!;

      if (instruction.type === 'compute') {
        status.state = 'Running';
        status.computeRemaining = instruction.duration - 1;
        status.programCounter++;
        this.events.push({
          tick: this.tickCount,
          processId: proc.id,
          action: `Started compute for ${instruction.duration} ticks`,
          outcome: 'computed',
        });
        if (status.computeRemaining === 0) {
          status.state = 'Ready';
        }
      } else if (instruction.type === 'release') {
        const resId = instruction.resourceId;
        const countToRelease = instruction.count;

        const assignEdge = this.systemState.edges.find(
          (e) => e.type === 'assignment' && e.from === resId && e.to === proc.id
        );

        if (assignEdge) {
          const releasedCount = Math.min(assignEdge.count, countToRelease);
          if (assignEdge.count === releasedCount) {
            this.systemState.edges = this.systemState.edges.filter((e) => e.id !== assignEdge.id);
          } else {
            assignEdge.count -= releasedCount;
          }
          freeInstances.set(resId, (freeInstances.get(resId) ?? 0) + releasedCount);

          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: `Released ${releasedCount} units of ${resId}`,
            outcome: 'released',
          });
        }

        status.programCounter++;
      } else if (instruction.type === 'request') {
        const resId = instruction.resourceId;
        const count = instruction.count;

        // Policy check first
        const policyCheck = checkPreventionPolicy(
          this.systemState,
          proc.id,
          resId,
          count,
          this.policies
        );

        if (!policyCheck.allowed) {
          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: `Request ${count} ${resId} rejected by policy`,
            outcome: 'rejected_policy',
            policyNotice: {
              policy: policyCheck.policyViolated!,
              rule: policyCheck.reason,
              coffmanCondition: policyCheck.coffmanCondition!,
            },
          });

          if (policyCheck.remedyAction === 'PREEMPT_HELD_RESOURCES') {
            // Break no-preemption: release all held resources
            const heldEdges = this.systemState.edges.filter(
              (e) => e.type === 'assignment' && e.to === proc.id
            );
            for (const hEdge of heldEdges) {
              freeInstances.set(hEdge.from, (freeInstances.get(hEdge.from) ?? 0) + hEdge.count);
            }
            this.systemState.edges = this.systemState.edges.filter(
              (e) => !(e.type === 'assignment' && e.to === proc.id)
            );
            status.state = 'Waiting';
          } else {
            // REJECT (e.g. circular-wait ordering, hold-and-wait): the request is
            // denied and the process continues *without* acquiring the resource.
            // Advancing the program counter is what lets a prevented run make
            // progress and terminate (rather than retrying the same denied request
            // forever), which is required for the ordered dining-philosophers demo
            // to complete.
            status.state = 'Ready';
            status.programCounter++;
          }
          continue;
        }

        const free = freeInstances.get(resId) ?? 0;
        if (free >= count) {
          // Grant immediately
          freeInstances.set(resId, free - count);

          // Remove any pending request edge
          this.systemState.edges = this.systemState.edges.filter(
            (e) => !(e.type === 'request' && e.from === proc.id && e.to === resId)
          );

          // Add or augment assignment edge
          const existingAssign = this.systemState.edges.find(
            (e) => e.type === 'assignment' && e.from === resId && e.to === proc.id
          );
          if (existingAssign) {
            existingAssign.count += count;
          } else {
            this.systemState.edges.push({
              id: `assign-${resId}-${proc.id}-${this.tickCount}`,
              type: 'assignment',
              from: resId,
              to: proc.id,
              count,
            });
          }

          status.state = 'Ready';
          status.programCounter++;

          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: `Granted ${count} units of ${resId}`,
            outcome: 'granted',
          });
        } else {
          // Block process; add request edge if not already present
          status.state = 'Waiting';
          const hasReqEdge = this.systemState.edges.some(
            (e) => e.type === 'request' && e.from === proc.id && e.to === resId
          );
          if (!hasReqEdge) {
            this.systemState.edges.push({
              id: `req-${proc.id}-${resId}`,
              type: 'request',
              from: proc.id,
              to: resId,
              count,
            });
          }

          this.events.push({
            tick: this.tickCount,
            processId: proc.id,
            action: `Blocked waiting for ${count} units of ${resId}`,
            outcome: 'blocked',
          });
        }
      }
    }

    // Run continuous deadlock detection
    const detection = detectDeadlock(this.systemState).result;
    if (detection.hasDeadlock) {
      if (this.deadlockTick === undefined) {
        this.deadlockTick = this.tickCount;
      }
      for (const dPid of detection.deadlockedProcessIds) {
        const s = this.statuses.get(dPid);
        if (s) {
          s.state = 'Deadlocked';
        }
      }
    }

    return this.getSnapshot();
  }
}
