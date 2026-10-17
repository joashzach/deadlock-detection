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
  const detectionSteps = useLabStore((s) => s.detectionSteps);
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
      <div className="p-16 text-body-sm text-graphite">
        Matrices appear once the scenario has at least one process and one resource.
      </div>
    );
  }

  return (
    <div className="p-16 space-y-24 text-body-sm">
      {EDITABLE.map((name) => (
        <section key={name}>
          <h3 className="font-semibold text-ink-black mb-4">{LABELS[name].title}</h3>
          <p className="text-graphite mb-8">{LABELS[name].hint}</p>
          <div className="overflow-x-auto">
            <table className="border-collapse font-mono text-body-sm">
              <thead>
                <tr>
                  <th className="border border-fog px-8 py-4 text-left text-graphite"> </th>
                  {rIds.map((r) => (
                    <th key={r} className="border border-fog px-8 py-4 text-charcoal">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pIds.map((p, i) => (
                  <tr key={p}>
                    <th className="border border-fog px-8 py-4 text-left text-charcoal">{p}</th>
                    {rIds.map((_, j) => {
                      const grid = matrices[name] as number[][];
                      const value = grid[i]?.[j] ?? 0;
                      const isHot = highlighted.has(`${name}:${i}:${j}`);
                      return (
                        <td key={j} className="border border-fog p-0">
                          <input
                            type="number"
                            min={0}
                            className={clsx(
                              'w-[52px] px-6 py-4 text-center font-mono bg-transparent border-0',
                              isHot && 'bg-obsidian text-off-white'
                            )}
                            value={value}
                            aria-label={`${LABELS[name].title} ${p} ${rIds[j]}`}
                            onChange={(e) => {
                              const result = setMatrixCell(name, i, j, Number(e.target.value));
                              if (!result.ok) {
                                e.currentTarget.setAttribute('aria-invalid', 'true');
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

      <section>
        <h3 className="font-semibold text-ink-black mb-4">{LABELS.available.title}</h3>
        <p className="text-graphite mb-8">{LABELS.available.hint}</p>
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-body-sm">
            <thead>
              <tr>
                {rIds.map((r) => (
                  <th key={r} className="border border-fog px-8 py-4 text-charcoal">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {rIds.map((_, j) => (
                  <td key={j} className="border border-fog px-8 py-4 text-center text-graphite">
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
