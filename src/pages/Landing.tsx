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
  const classicPreset = PRESETS['classic-deadlock'];
  const detectionResult = useMemo(() => {
    if (!classicPreset?.state) return null;
    return detectDeadlock(classicPreset.state).result;
  }, [classicPreset]);

  const chipText = detectionResult?.hasDeadlock ? 'Deadlock detected' : 'No deadlock';

  return (
    <div
      className="w-full h-full overflow-y-auto select-none bg-white"
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Hero Section: fills exactly first screen (min-height 100% of row 2), vertically centered */}
      <section
        className="w-full bg-tint-bg min-h-[calc(100dvh-var(--nav-h))] flex items-center px-[var(--page-pad-x)] py-32"
        data-testid="landing-hero"
      >
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-[clamp(32px,5vw,96px)]">
          {/* Left Hero Content: H1 (2 lines at >=1024px) + mono paragraph (max 480px) */}
          <div className="w-full">
            <h1
              className="font-poppins text-ink font-semibold text-[clamp(32px,3.4vw,48px)] leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              See deadlocks happen.
              <br />
              Then understand them.
            </h1>
            <p className="mt-24 font-mono text-[15px] leading-[1.8] text-muted max-w-[480px]">
              Simulate processes and resources, then watch detection, avoidance, prevention and recovery run one step at a time.
            </p>
          </div>

          {/* Right Hero Figure Card: white, 1px border, shadow none */}
          <div
            className="w-full max-w-[560px] bg-white border border-line shadow-none rounded-none justify-self-center lg:justify-self-end"
            data-testid="hero-figure-card"
          >
            {/* Header: mono header with title and danger chip from engine */}
            <div className="px-24 h-[56px] border-b border-line flex items-center justify-between">
              <span className="font-mono text-[14px] text-ink font-medium">
                Classic 2-process deadlock
              </span>
              <span
                className="inline-flex items-center px-8 py-2 border border-danger/30 bg-danger-tint text-danger font-mono text-[12px] font-medium"
                data-testid="hero-status-chip"
              >
                {chipText}
              </span>
            </div>

            {/* LIVE engine-rendered graph with 24px padding */}
            <div className="flex items-center justify-center p-24">
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

      {/* How it works Section: starts directly below hero, padding 64px vertical, section heading 28px, 24px gap */}
      <section className="w-full bg-white py-64 px-[var(--page-pad-x)]">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-poppins text-page-title font-semibold leading-[1.3] text-ink mb-24">
            How it works
          </h2>

          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-48"
            data-testid="how-it-works-columns"
          >
            {STEPS.map((step) => (
              <div key={step.num} className="border-t-2 border-ink pt-24">
                <span className="font-mono text-[14px] text-navy font-semibold block">
                  {step.num}
                </span>
                <h3 className="font-poppins text-section-heading text-ink font-semibold mt-8 mb-12">
                  {step.title}
                </h3>
                <p className="font-mono text-body-mono leading-[1.8] text-muted">
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
