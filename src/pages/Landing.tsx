import { useMemo } from 'react';
import { PRESETS } from '../scenarios/presets';
import { detectDeadlock } from '../engine/detect';

const STEPS = [
  {
    num: '01',
    title: 'Build a scenario',
    description:
      'Add processes and resources, or load a textbook example. Draw request (P→R) and assignment (R→P) edges, or edit the matrices directly.',
  },
  {
    num: '02',
    title: 'Run an algorithm',
    description:
      "Detect cycles with the Wait-For Graph or the multi-instance matrix algorithm, check safety with Banker's algorithm, or enable prevention policies.",
  },
  {
    num: '03',
    title: 'Watch and recover',
    description:
      'Step through every decision in plain English, see exactly which resources move, then terminate or preempt to break the deadlock and confirm it is resolved.',
  },
];

export function Landing() {
  // Engine detection result for classic deadlock preset - computed from engine, never hardcoded
  const classicPreset = PRESETS['classic-deadlock'];
  const detectionResult = useMemo(() => {
    if (!classicPreset?.state) return null;
    return detectDeadlock(classicPreset.state).result;
  }, [classicPreset]);

  const chipText = detectionResult?.hasDeadlock ? 'Deadlock detected' : 'No deadlock';

  return (
    <div className="w-full bg-white flex flex-col min-h-0 select-none">
      {/* Hero Section: fills exactly first screen (min-height: calc(100dvh - var(--nav-h))), vertically centered */}
      <section
        className="w-full bg-tint-bg min-h-[calc(100dvh-var(--nav-h))] flex items-center px-[var(--page-pad-x)] max-md:px-16 py-[32px]"
        data-testid="landing-hero"
      >
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-[clamp(32px,5vw,96px)]">
          {/* Left Hero Content: h1 (2 lines at >=1024px) + mono paragraph (max 480px) */}
          <div className="w-full">
            <h1
              className="font-poppins text-ink font-semibold text-[clamp(32px,3.4vw,48px)] leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              See deadlocks happen.
              <br />
              Then understand them.
            </h1>
            <p className="mt-[24px] font-mono text-[16px] leading-[1.8] text-muted max-w-[480px]">
              Simulate processes and resources, then watch detection, avoidance, prevention and recovery run one step at a time.
            </p>
          </div>

          {/* Right Hero Figure Card: white, 1px border, shadow none */}
          <div
            className="w-full max-w-[560px] bg-white border border-line shadow-none rounded-none justify-self-center lg:justify-self-end"
            data-testid="hero-figure-card"
          >
            {/* Header: clamp(44px, 6vh, 56px) + danger chip */}
            <div
              className="px-[24px] border-b border-line flex items-center justify-between"
              style={{ height: 'clamp(44px, 6vh, 56px)' }}
            >
              <span className="font-mono text-[14px] text-ink font-medium">
                Classic 2-process deadlock
              </span>
              <span
                className="inline-flex items-center px-[8px] py-[2px] border border-danger/30 bg-danger-tint text-danger font-mono text-[12px] font-medium"
                data-testid="hero-status-chip"
              >
                {chipText}
              </span>
            </div>

            {/* LIVE engine-rendered graph */}
            <div
              className="flex items-center justify-center p-[32px] md:p-[48px]"
            >
              <svg
                viewBox="0 0 380 200"
                className="w-full h-auto max-w-[360px]"
                aria-label="Classic 2-process deadlock graph"
              >
                <defs>
                  <marker
                    id="hero-arrow-solid"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0B1220" />
                  </marker>
                  <marker
                    id="hero-arrow-danger"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B42318" />
                  </marker>
                </defs>

                {/* Assignment R1 -> P1 (solid) */}
                <line
                  x1="270"
                  y1="50"
                  x2="110"
                  y2="50"
                  stroke="#0B1220"
                  strokeWidth="1.5"
                  markerEnd="url(#hero-arrow-solid)"
                />

                {/* Assignment R2 -> P2 (solid) */}
                <line
                  x1="270"
                  y1="150"
                  x2="110"
                  y2="150"
                  stroke="#0B1220"
                  strokeWidth="1.5"
                  markerEnd="url(#hero-arrow-solid)"
                />

                {/* Request P1 -> R2 (dashed danger) */}
                <line
                  x1="102"
                  y1="64"
                  x2="278"
                  y2="138"
                  stroke="#B42318"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  markerEnd="url(#hero-arrow-danger)"
                />

                {/* Request P2 -> R1 (dashed danger) */}
                <line
                  x1="102"
                  y1="136"
                  x2="278"
                  y2="62"
                  stroke="#B42318"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  markerEnd="url(#hero-arrow-danger)"
                />

                {/* Processes (circles on left) */}
                <g transform="translate(80, 50)">
                  <circle cx="0" cy="0" r="24" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="4" className="font-mono text-[13px] font-semibold" fill="#0B1220">
                    P1
                  </text>
                </g>
                <g transform="translate(80, 150)">
                  <circle cx="0" cy="0" r="24" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="4" className="font-mono text-[13px] font-semibold" fill="#0B1220">
                    P2
                  </text>
                </g>

                {/* Resources (rectangles on right) */}
                <g transform="translate(300, 50)">
                  <rect x="-32" y="-18" width="64" height="36" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="4" className="font-mono text-[13px]" fill="#0B1220">
                    R1
                  </text>
                </g>
                <g transform="translate(300, 150)">
                  <rect x="-32" y="-18" width="64" height="36" fill="#FFFFFF" stroke="#0B1220" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="4" className="font-mono text-[13px]" fill="#0B1220">
                    R2
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section: starts directly below hero, section padding clamp(64px, 10vh, 96px) vertical, 28px heading, 40px gap */}
      <section className="w-full bg-white py-[clamp(64px,10vh,96px)] px-[var(--page-pad-x)] max-md:px-16">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-poppins text-[28px] font-semibold leading-[1.3] text-ink mb-[40px]">
            How it works
          </h2>

          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-[40px]"
            data-testid="how-it-works-columns"
          >
            {STEPS.map((step) => (
              <div key={step.num} className="border-t-2 border-ink pt-[24px]">
                <span className="font-mono text-[14px] text-navy font-semibold block">
                  {step.num}
                </span>
                <h3 className="font-poppins text-[20px] text-ink font-semibold mt-[8px] mb-[12px]">
                  {step.title}
                </h3>
                <p className="font-mono text-[15px] leading-[1.8] text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

