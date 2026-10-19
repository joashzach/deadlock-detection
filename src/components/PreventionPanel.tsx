import { useLabStore } from '../store/useLabStore';
import { PreventionPolicies } from '../engine/types';

const TOGGLES: Array<{
  key: keyof PreventionPolicies;
  title: string;
  coffman: string;
  rule: string;
}> = [
  {
    key: 'breakHoldAndWait',
    title: 'Break Hold & Wait',
    coffman: 'Hold and Wait',
    rule: 'A process may only request a resource while it holds none, so it never waits while holding.',
  },
  {
    key: 'breakNoPreemption',
    title: 'Break No Preemption',
    coffman: 'No Preemption',
    rule: 'A blocked process releases everything it holds, so its resources can be reallocated.',
  },
  {
    key: 'breakCircularWait',
    title: 'Break Circular Wait',
    coffman: 'Circular Wait',
    rule: 'Resources are globally ordered R0 < R1 < …; a request for a lower-indexed resource than one already held is rejected.',
  },
];

export function PreventionPanel() {
  const policies = useLabStore((s) => s.policies);
  const setPolicies = useLabStore((s) => s.setPolicies);

  return (
    <section data-testid="prevention-panel" className="space-y-12">
      <h2 className="font-poppins text-panel-heading font-semibold text-ink">Prevention policies</h2>

      <ul className="space-y-8">
        {TOGGLES.map(({ key, title, coffman, rule }) => (
          <li key={key} className="border border-line bg-white p-12">
            <label className="flex items-start gap-8 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-4 rounded-none border-line text-navy focus:ring-0 focus:outline-navy"
                checked={policies[key]}
                data-testid={`policy-${key}`}
                onChange={(e) => setPolicies({ [key]: e.target.checked })}
              />
              <div>
                <span className="font-poppins text-[13px] font-semibold text-ink block mb-2">{title}</span>
                <span className="inline-block px-6 py-2 border border-line bg-tint-bg font-mono text-[11px] text-muted mb-4">
                  {coffman}
                </span>
                <span className="block font-mono text-[12px] leading-relaxed text-muted">{rule}</span>
              </div>
            </label>
          </li>
        ))}
      </ul>

      <div className="border border-line bg-white p-12 mt-8" data-testid="mutual-exclusion-card">
        <p className="font-poppins text-[13px] font-semibold text-ink mb-4">Mutual Exclusion — informational</p>
        <p className="font-mono text-[12px] leading-relaxed text-muted">
          Mutual exclusion cannot be removed for non-shareable resources: a printer, a write lock, or a single
          hardware register genuinely cannot serve two processes at once. Removing it would corrupt data, so
          DeadLockLab explains rather than toggles it. Prevention instead targets the other three conditions.
        </p>
      </div>
    </section>
  );
}
