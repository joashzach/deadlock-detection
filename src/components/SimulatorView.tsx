import { useLabStore } from '../store/useLabStore';
import { SimulatorState } from '../engine/simulator';
import { MiniGraph } from './MiniGraph';
import { Button } from './ui/Button';

export function SimulatorView({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const simulator = useLabStore((s) => s.simulator);
  const initSimulator = useLabStore((s) => s.initSimulator);
  const stepSimulator = useLabStore((s) => s.stepSimulator);
  const resetSimulator = useLabStore((s) => s.resetSimulator);

  if (!simulator) {
    return (
      <div className="h-full flex items-center justify-center p-24">
        <div className="p-32 text-center border border-line bg-white max-w-[480px]">
          {!hideHeader && (
            <h2 className="font-poppins text-h3 font-semibold text-ink mb-12">Live simulator</h2>
          )}
          <p className="font-mono text-[14px] text-muted mb-24 leading-relaxed">
            Two deterministic runs comparing baseline concurrency with your active prevention policies.
          </p>
          <Button
            variant="primary"
            onClick={initSimulator}
            data-testid="init-simulator"
          >
            Initialise simulation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between select-none">
      {!hideHeader && (
        <div className="sr-only" role="group" aria-label="Standalone simulator controls">
          <button type="button" onClick={() => stepSimulator()} data-testid="sim-step">
            Step
          </button>
          <button type="button" onClick={() => resetSimulator()} data-testid="reset-simulator">
            Reset
          </button>
          <span data-testid="sim-tick">tick {simulator.policied.tick}</span>
        </div>
      )}

      <div className="sr-only" data-testid="sim-comparison">
        {simulator.baseline.detectionResult?.hasDeadlock ? (
          <span>Baseline deadlocked</span>
        ) : (
          <span>Baseline: no deadlock</span>
        )}
        {simulator.policied.detectionResult?.hasDeadlock ? (
          <span>Policied run deadlocked</span>
        ) : (
          <span>Policied run free of deadlock</span>
        )}
      </div>

      {/* Two equal-width, equal-height bordered white panels side by side filling remaining height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-16 min-h-0">
        <RunPanel label="Without policies" run={simulator.baseline} testId="run-baseline" />
        <RunPanel label="With policies" run={simulator.policied} testId="run-policied" />
      </div>
    </div>
  );
}

function RunPanel({
  label,
  run,
  testId,
}: {
  label: string;
  run: SimulatorState;
  testId: string;
}) {
  const scenario = useLabStore((s) => s.scenario);
  const dangerIds = run.detectionResult?.deadlockedProcessIds ?? [];
  const isWithout = label.toLowerCase().startsWith('without');
  const isWith = !isWithout;

  const hasDeadlock = run.detectionResult?.hasDeadlock ?? false;

  const displayScenario = {
    ...run.systemState,
    edges: [
      ...run.systemState.edges,
      ...scenario.edges.filter(
        (e) => e.type === 'request' && !run.systemState.edges.some((re) => re.from === e.from && re.to === e.to)
      ),
    ],
  };

  const getDotColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running':
        return '#067647';
      case 'blocked':
      case 'waiting':
        return '#B42318';
      case 'finished':
        return '#566079';
      case 'ready':
      default:
        return '#566079';
    }
  };

  const allReady = run.processStatuses.every((p) => p.state === 'Ready');
  const allFinished = run.processStatuses.every((p) => p.state === 'Finished');
  let summary = `${run.processStatuses.length} processes · all ready`;
  if (hasDeadlock && dangerIds.length > 0) {
    summary = `${run.processStatuses.length} processes · ${dangerIds.length} deadlocked`;
  } else if (allFinished) {
    summary = `${run.processStatuses.length} processes · all finished`;
  } else if (!allReady) {
    const active = run.processStatuses.filter((p) => p.state !== 'Finished').length;
    summary = `${run.processStatuses.length} processes · ${active} active`;
  }

  return (
    <section
      className="border border-line bg-white flex flex-col justify-between h-full min-h-0"
      data-testid={testId}
    >
      {/* Panel header: 48px, Poppins 16/600 on left, mono 12 status tag on right */}
      <div className="flex items-center justify-between shrink-0 h-[48px] min-h-[48px] px-[24px] border-b border-line bg-white">
        <h3 className="font-poppins text-panel-heading font-semibold text-ink">{label}</h3>
        <div>
          {isWithout && (
            <span className="inline-flex items-center px-8 py-2 border border-danger/30 bg-danger-tint font-mono text-[12px] text-danger font-medium">
              {hasDeadlock ? 'deadlocked' : 'deadlock expected'}
            </span>
          )}
          {isWith && (
            <span
              className={`inline-flex items-center px-8 py-2 border font-mono text-[12px] font-medium ${
                hasDeadlock
                  ? 'border-danger/30 bg-danger-tint text-danger'
                  : 'border-success/30 bg-success-tint text-success'
              }`}
            >
              {hasDeadlock ? 'deadlock detected' : 'deadlock-free'}
            </span>
          )}
        </div>
      </div>

      {/* Body: Graph centered and scaled to panel */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-[24px]">
        <MiniGraph
          scenario={displayScenario}
          dangerIds={dangerIds}
          label={`${label} resource allocation graph`}
          isPolicied={isWith}
        />
      </div>

      {/* Footer: padding 0 24px 24px, single row of equal chips (32px), then mono 12 muted summary */}
      <div className="pt-0 shrink-0 px-[24px] pb-[24px]">
        <div
          className="flex gap-[8px] items-center w-full mb-[12px] flex-nowrap overflow-hidden"
          data-testid={`${testId}-processes`}
        >
          {run.processStatuses.map((p) => {
            const dotColor = getDotColor(p.state);
            return (
              <div
                key={p.processId}
                className="flex-1 min-w-0 h-[var(--chip-h)] border border-line bg-white flex items-center justify-center gap-6 px-4 font-mono text-[12px] text-ink whitespace-nowrap overflow-hidden"
                title={`${p.processId}: ${p.state}`}
              >
                <span
                  className="w-[6px] h-[6px] rounded-none shrink-0"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                <span className="shrink-0">{p.processId}</span>
              </div>
            );
          })}
        </div>

        <div className="font-mono text-[12px] text-muted">
          {summary}
        </div>
      </div>
    </section>
  );
}
