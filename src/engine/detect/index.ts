/**
 * Unified Detection Dispatcher.
 * Automatically chooses single-instance WFG or multi-instance matrix algorithm based on scenario,
 * with optional manual override and suitability warnings.
 */
import { SystemState, TraceResult, DetectionResult } from '../types';
import { detectCycleSingleInstance } from './cycleDetect';
import { detectMatrixMultiInstance } from './matrixDetect';

export function isSingleInstanceSystem(state: SystemState): boolean {
  return state.resources.every((r) => r.totalInstances === 1);
}

export function detectDeadlock(
  state: SystemState,
  overrideAlgorithm?: 'single-instance-wfg' | 'multi-instance-matrix'
): TraceResult<DetectionResult> {
  const isSingle = isSingleInstanceSystem(state);
  const algo = overrideAlgorithm ?? (isSingle ? 'single-instance-wfg' : 'multi-instance-matrix');

  if (algo === 'single-instance-wfg') {
    return detectCycleSingleInstance(state);
  } else {
    return detectMatrixMultiInstance(state);
  }
}
