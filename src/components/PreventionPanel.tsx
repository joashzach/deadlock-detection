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
    <section data-testid="prevention-panel">
      <h2 className="section-heading mb-8">Prevention policies</h2>
      <p className="text-graphite mb-8">
        Each toggle removes one Coffman condition in the live simulator. Denied requests are reported with the policy,
        the rule, and the condition it enforces.
      </p>

      <ul className="space-y-8">
        {TOGGLES.map(({ key, title, coffman, rule }) => (
          <li key={key} className="panel p-16">
            <label className="flex items-start gap-8 cursor-pointer">
              <input
                type="checkbox"
                className="mt-4"
                checked={policies[key]}
                data-testid={`policy-${key}`}
                onChange={(e) => setPolicies({ [key]: e.target.checked })}
              />
              <span>
                <span className="font-semibold text-ink-black block mb-4">{title}</span>
                <span className="chip mb-4">{coffman}</span>
                <span className="block text-body-sm text-graphite">{rule}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="panel p-16 mt-8" data-testid="mutual-exclusion-card">
        <p className="font-semibold text-ink-black mb-4">Mutual Exclusion — informational</p>
        <p className="text-body-sm text-charcoal">
          Mutual exclusion cannot be removed for non-shareable resources: a printer, a write lock, or a single
          hardware register genuinely cannot serve two processes at once. Removing it would corrupt data, so
          DeadlockLab explains rather than toggles it. Prevention instead targets the other three conditions.
        </p>
      </div>
    </section>
  );
}
