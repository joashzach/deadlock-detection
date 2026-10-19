import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLabStore } from '../store/useLabStore';

interface PolicyNotice {
  policy: string;
  rule: string;
  coffmanCondition: string;
}

const DISMISS_MS = 6000;

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
      className="fixed bottom-[64px] right-24 z-50 bg-white border border-line border-l-4 border-l-warning p-16 max-w-[380px] shadow-none rounded-none"
      role="status"
      aria-live="polite"
      data-testid="policy-toast"
    >
      <p className="font-poppins text-[13px] font-semibold text-ink mb-4">
        {notice.policy} blocked a request
      </p>
      <p className="font-mono text-[12px] text-muted mb-4 leading-relaxed">{notice.rule}</p>
      <p className="font-mono text-[12px] text-muted">
        Enforces <span className="font-semibold text-ink">{notice.coffmanCondition}</span>
      </p>
      <button
        type="button"
        className="font-mono text-[12px] text-muted hover:text-ink mt-8 cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
        onClick={() => setNotice(null)}
      >
        dismiss
      </button>
    </motion.div>
  );
}
