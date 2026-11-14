import { useLabStore } from '../store/useLabStore';
import { PreventionPolicies } from '../engine/types';

const TOGGLES: Array<{
  key: keyof PreventionPolicies;
  title: string;
  rule: string;
}> = [
  {
    key: 'breakHoldAndWait',
    title: 'Break Hold & Wait',
    rule: 'A process may only request a resource while it holds none, so it never waits while holding.',
  },
  {
    key: 'breakNoPreemption',
    title: 'Break No Preemption',
    rule: 'A blocked process releases everything it holds, so its resources can be reallocated.',
  },
  {
    key: 'breakCircularWait',
    title: 'Break Circular Wait',
    rule: 'Resources are globally ordered R0 < R1 < …; a request for a lower-indexed resource than one already held is rejected.',
  },
];

export function PreventionPanel() {
  const policies = useLabStore((s) => s.policies);
  const setPolicies = useLabStore((s) => s.setPolicies);

  return (
    <div data-testid="prevention-panel" className="w-full select-none divide-y divide-line">
      {TOGGLES.map(({ key, title, rule }) => (
        <div key={key} className="py-12 first:pt-0 last:pb-12">
          <label className="grid grid-cols-[16px_minmax(0,1fr)] gap-12 items-start cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-[3px] h-[16px] w-[16px] rounded-none border-line text-navy accent-navy focus:outline-navy cursor-pointer"
              checked={policies[key]}
              data-testid={`policy-${key}`}
              onChange={(e) => setPolicies({ [key]: e.target.checked })}
            />
            <div className="min-w-0">
              <span className="font-poppins text-sidebar-title text-ink block">
                {title}
              </span>
              <p
                className="font-mono text-small-mono text-muted mt-4"
                title={rule}
              >
                {rule}
              </p>
            </div>
          </label>
        </div>
      ))}

      {/* Read-only Mutual Exclusion item */}
      <div className="py-12 last:pb-0" data-testid="mutual-exclusion-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-8 items-start">
          <div className="min-w-0">
            <span className="font-poppins text-sidebar-title text-ink block">
              Mutual Exclusion
            </span>
            <p
              className="font-mono text-small-mono text-muted mt-4"
              title="Mutual exclusion cannot be removed for non-shareable resources. DeadLockLab explains rather than toggles it."
            >
              Mutual exclusion cannot be removed for non-shareable resources. DeadLockLab explains rather than toggles it.
            </p>
          </div>
          <span className="font-mono text-tiny-mono text-muted border border-line bg-tint-bg px-6 py-2 shrink-0">
            Info
          </span>
        </div>
      </div>
    </div>
  );
}
