import { useMemo } from 'react';
import clsx from 'clsx';
import { useLabStore, MatrixName } from '../store/useLabStore';
import { deriveMatricesFromRAG } from '../engine/rag';

const EDITABLE: MatrixName[] = ['allocation', 'max', 'need', 'request'];

const LABELS: Record<MatrixName, { title: string; hint: string }> = {
  allocation: { title: 'Allocation', hint: 'Instances currently held by each process (drives assignment edges).' },
  max: { title: 'Max', hint: 'Declared maximum demand per process; must be ≥ Allocation.' },
  need: { title: 'Need', hint: 'Max − Allocation. Editing Need sets Max = Allocation + Need.' },
  request: { title: 'Request', hint: 'Outstanding requests (drives request edges).' },
  available: { title: 'Available', hint: 'Total instances − Σ Allocation. Derived, read-only.' },
};

export function MatrixEditor() {
  const scenario = useLabStore((s) => s.scenario);
  const setMatrixCell = useLabStore((s) => s.setMatrixCell);
  const detectionSteps = useLabStore((s) => s.traceSteps);
  const stepIndex = useLabStore((s) => s.stepIndex);

  const matrices = useMemo(() => {
    const m = deriveMatricesFromRAG(scenario);
    return {
      allocation: m.allocation,
      max: m.max!,
      need: m.need!,
      request: m.request,
      available: m.available,
    };
  }, [scenario]);
  const currentStep = detectionSteps[stepIndex];

  const highlighted = useMemo(() => {
    const set = new Set<string>();
    for (const cell of currentStep?.highlight?.matrixCells ?? []) {
      set.add(`${cell.matrix}:${cell.row}:${cell.col}`);
    }
    return set;
  }, [currentStep]);

  const pIds = scenario.processes.map((p) => p.id);
  const rIds = scenario.resources.map((r) => r.id);

  if (scenario.processes.length === 0 || scenario.resources.length === 0) {
    return (
      <div className="text-[12px] text-muted font-mono">
        Matrices appear once the scenario has at least one process and one resource.
      </div>
    );
  }

  return (
    <div className="space-y-16 text-body-sm w-full">
      {EDITABLE.map((name) => (
        <section key={name} className="w-full">
          <h3 className="font-poppins text-[13px] font-semibold text-ink mb-2">{LABELS[name].title}</h3>
          <p className="font-mono text-[11px] text-muted mb-6 leading-tight">{LABELS[name].hint}</p>
          <div className="overflow-x-auto w-full p-[2px]">
            <table className="w-full border-collapse font-mono text-[12px]">
              <thead>
                <tr>
                  <th className="border border-line px-6 py-2 text-left text-muted font-normal w-[44px] min-w-[44px]"> </th>
                  {rIds.map((r) => (
                    <th key={r} className="border border-line px-6 py-2 text-center text-ink font-normal min-w-[38px]">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pIds.map((p, i) => (
                  <tr key={p}>
                    <th className="border border-line px-6 py-2 text-left text-ink font-normal w-[44px] min-w-[44px]">{p}</th>
                    {rIds.map((_, j) => {
                      const grid = matrices[name] as number[][];
                      const value = grid[i]?.[j] ?? 0;
                      const isHot = highlighted.has(`${name}:${i}:${j}`);
                      return (
                        <td
                          key={j}
                          className="border border-line p-0 text-center min-w-[38px] relative focus-within:z-10 cursor-text hover:bg-tint-bg/40 transition-colors"
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            input?.focus();
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            className={clsx(
                              'w-full h-[28px] text-center font-mono text-[12px] text-ink bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-inset focus:ring-navy focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy focus:bg-tint-bg focus:text-ink [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none m-0 p-0 cursor-text select-all',
                              isHot && '!bg-navy !text-white font-medium'
                            )}
                            value={value}
                            aria-label={`${LABELS[name].title} ${p} ${rIds[j]}`}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num = raw === '' ? 0 : Number(raw);
                              if (!isNaN(num)) {
                                const result = setMatrixCell(name, i, j, Math.max(0, num));
                                if (!result.ok) {
                                  e.currentTarget.setAttribute('aria-invalid', 'true');
                                } else {
                                  e.currentTarget.removeAttribute('aria-invalid');
                                }
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="w-full">
        <h3 className="font-poppins text-[13px] font-semibold text-ink mb-2">{LABELS.available.title}</h3>
        <p className="font-mono text-[11px] text-muted mb-6 leading-tight">{LABELS.available.hint}</p>
        <div className="overflow-x-auto w-full p-[2px]">
          <table className="w-full border-collapse font-mono text-[12px]">
            <thead>
              <tr>
                {rIds.map((r) => (
                  <th key={r} className="border border-line px-6 py-2 text-center text-ink font-normal min-w-[38px]">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {rIds.map((_, j) => (
                  <td key={j} className="border border-line h-[28px] px-6 py-2 text-center font-mono text-[12px] text-ink font-normal min-w-[38px]">
                    {matrices.available[j] ?? 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
