/**
 * Pseudocode shown in the right-hand panel. The engine's `Step.pseudocodeLine`
 * values are 1-based indices into these arrays.
 */

export const CYCLE_PSEUDOCODE = [
  'WFG ← convert(RAG)   // P_i → P_j when P_i waits on a resource held by P_j',
  'for each process u not yet visited:  DFS(u)',
  '  colour u grey; push u onto the current path',
  '  for each edge u → v in the WFG:',
  '    if v is grey on the path  →  CYCLE FOUND (deadlock)',
  '    else if v is white: DFS(v)',
  '  pop u; colour u black',
  'deadlocked ← cycle members ∪ { p : p can reach a cycle member }',
];

export const MATRIX_PSEUDOCODE = [
  'Work ← Available',
  'Finish[i] ← (Allocation[i] = 0  ∧  Request[i] = 0)   // not holding and not waiting',
  'repeat:  find i with ¬Finish[i] and Request[i] ≤ Work',
  '         Work ← Work + Allocation[i];  Finish[i] ← true',
  'deadlocked ← { P_i : ¬Finish[i] }   // they can never complete',
];

export const BANKER_SAFETY_PSEUDOCODE = [
  'Work ← Available;   Finish[i] ← false for all i',
  'repeat:  find i with ¬Finish[i] and Need[i] ≤ Work',
  '         Work ← Work + Allocation[i];  Finish[i] ← true;  append P_i to sequence',
  'safe ⟺ Finish[i] = true for every i',
];

export const BANKER_REQUEST_PSEUDOCODE = [
  'receive Request_i from process P_i',
  'if Request_i > Need_i            →  ERROR (exceeds declared need)',
  'if Request_i > Available         →  WAIT (not enough resources)',
  'provisionally:  Available ← Available − Request_i;  Allocation_i += Request_i;  Need_i −= Request_i',
  'if the provisional state is safe →  GRANT',
  'else                             →  DENY (unsafe); roll back',
];

export const RECOVERY_PSEUDOCODE = [
  'detect deadlocked set D',
  'TERMINATE ALL:  remove every process in D',
  'TERMINATE VICTIM:  pick P ∈ D (fewest resources held) and remove it',
  'PREEMPT:  take resources away from a process in D',
  're-run detection to confirm the deadlock is resolved',
];

export const SIMULATION_PSEUDOCODE = [
  'tick ← 0;   load process scripts',
  'for each tick:',
  '  for each ready process, execute the next script instruction',
  '    request R → if free, grant; else block and record a request edge',
  '    release R → return instances to the pool',
  '    compute n → spend n ticks',
  '  apply prevention policies to every request',
  '  run deadlock detection; flag the first tick a deadlock appears',
  'stop when all processes finish, a deadlock is confirmed, or maxTicks is reached',
];

export function pseudocodeFor(kind: string, algorithm?: string): string[] {
  if (kind === 'banker-safety') return BANKER_SAFETY_PSEUDOCODE;
  if (kind === 'banker-request') return BANKER_REQUEST_PSEUDOCODE;
  if (kind === 'recovery') return RECOVERY_PSEUDOCODE;
  if (kind === 'simulation') return SIMULATION_PSEUDOCODE;
  return algorithm === 'multi-instance-matrix' ? MATRIX_PSEUDOCODE : CYCLE_PSEUDOCODE;
}
