/** Algorithm complexity reference, shared by the Learn and About pages (PRD §4.7). */
export interface ComplexityRow {
  algorithm: string;
  time: string;
  space: string;
  note: string;
}

export const COMPLEXITY: ComplexityRow[] = [
  {
    algorithm: 'WFG cycle detection',
    time: 'O(V + E)',
    space: 'O(V + E)',
    note: 'Depth-first search over processes and wait-for edges.',
  },
  {
    algorithm: 'Multi-instance detection',
    time: 'O(n² · m)',
    space: 'O(n · m)',
    note: 'Up to n scans of the n × m request matrix.',
  },
  {
    algorithm: "Banker's safety",
    time: 'O(n² · m)',
    space: 'O(n · m)',
    note: 'Up to n passes over n processes and m resources.',
  },
  {
    algorithm: "Banker's request",
    time: 'O(n² · m)',
    space: 'O(n · m)',
    note: 'One provisional allocation plus one safety run.',
  },
  {
    algorithm: 'Circular-wait check',
    time: 'O(m)',
    space: 'O(1)',
    note: 'Compare resource indices against those currently held.',
  },
  {
    algorithm: 'Recovery',
    time: 'O(n² · m)',
    space: 'O(n · m)',
    note: 'Apply the action, then re-run detection to confirm.',
  },
];
