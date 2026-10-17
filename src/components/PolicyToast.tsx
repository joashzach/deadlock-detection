import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLabStore } from '../store/useLabStore';

interface PolicyNotice {
  policy: string;
  rule: string;
  coffmanCondition: string;
}

const DISMISS_MS = 6000;

/**
 * Shows a toast whenever a prevention policy blocks or alters a simulation action,
 * naming the policy, the rule it enforces, and the Coffman condition behind it (PRD 4.4).
 * The same events are also listed in the Log panel, so nothing is lost when it fades.
 *
 * The entrance animates a small offset rather than opacity so the message can never
 * be left invisible if animation frames are throttled, and dismissal is immediate
 * (no exit animation to wait on).
 */
export function PolicyToast() {
  const simulator = useLabStore((s) => s.simulator);
  const [notice, setNotice] = useState<PolicyNotice | null>(null);
  const seenRef = useRef(0);
  const reducedMotion = useReducedMotion();

  const policyEvents = useMemo(
    () => (simulator ? simulator.policied.events.filter((e) => e.policyNotice) : []),
    [simulator]
  );

  useEffect(() => {
    if (policyEvents.length <= seenRef.current) {
      if (policyEvents.length === 0) seenRef.current = 0;
      return;
    }
    seenRef.current = policyEvents.length;
    const latest = policyEvents[policyEvents.length - 1]!.policyNotice;
    if (latest) setNotice(latest);
  }, [policyEvents]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), DISMISS_MS);
    return () => clearTimeout(id);
  }, [notice]);

  if (!notice) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className="fixed bottom-[96px] right-16 z-30 panel p-16 max-w-[380px] accent-bar"
      role="status"
      aria-live="polite"
      data-testid="policy-toast"
    >
      <p className="font-semibold text-ink-black mb-4">
        <span aria-hidden="true">⚠</span> {notice.policy} blocked a request
      </p>
      <p className="text-body-sm text-charcoal mb-4">{notice.rule}</p>
      <p className="text-body-sm text-graphite">
        Enforces <span className="font-semibold text-charcoal">{notice.coffmanCondition}</span>
      </p>
      <button type="button" className="btn btn-ghost mt-4" onClick={() => setNotice(null)}>
        dismiss
      </button>
    </motion.div>
  );
}
