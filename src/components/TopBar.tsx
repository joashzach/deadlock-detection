import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLabStore, AlgorithmChoice } from '../store/useLabStore';
import { serializeScenario, parseScenarioJson } from '../lib/schema';
import { isSingleInstanceSystem } from '../engine/detect';

const NAV = [
  { to: '/lab', label: 'Lab' },
  { to: '/learn', label: 'Learn' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/about', label: 'About' },
];

export function TopBar() {
  const scenario = useLabStore((s) => s.scenario);
  const scenarioName = useLabStore((s) => s.scenarioName);
  const algorithm = useLabStore((s) => s.algorithm);
  const setAlgorithm = useLabStore((s) => s.setAlgorithm);
  const importScenario = useLabStore((s) => s.importScenario);
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const single = isSingleInstanceSystem(scenario);

  const handleExport = () => {
    const json = serializeScenario(scenarioName, scenario);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenarioName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'scenario'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const result = parseScenarioJson(text);
    if (!result.ok || !result.scenario) {
      setImportError(result.error ?? 'Could not read that file');
      return;
    }
    const applied = importScenario(result.name ?? 'Imported scenario', result.scenario);
    setImportError(applied.ok ? null : (applied.error ?? 'Invalid scenario'));
  };

  return (
    <header className="border-b border-fog bg-off-white">
      <div className="flex items-center gap-16 px-16 h-[56px]">
        <Link to="/" className="font-semibold text-ink-black no-underline shrink-0" aria-label="DeadlockLab home">
          deadlock<span className="text-ember">lab</span>
        </Link>

        <nav className="hidden md:flex items-center gap-16" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                location.pathname.startsWith(item.to)
                  ? 'text-ink-black font-semibold no-underline'
                  : 'text-charcoal no-underline hover:underline'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-8">
          <label htmlFor="algorithm-select" className="text-graphite text-body-sm">
            Algorithm
          </label>
          <select
            id="algorithm-select"
            className="field w-auto"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmChoice)}
          >
            <option value="auto">Auto ({single ? 'WFG' : 'Matrix'})</option>
            <option value="single-instance-wfg">Single-instance WFG</option>
            <option value="multi-instance-matrix">Multi-instance matrix</option>
          </select>
        </div>

        <div className="hidden sm:flex items-center gap-8">
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExport}>
            Export
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import scenario JSON"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {importError && (
        <p className="px-16 py-8 text-body-sm chip chip-ember m-8" role="alert">
          ⚠ {importError}
          <button type="button" className="ml-8 underline" onClick={() => setImportError(null)}>
            dismiss
          </button>
        </p>
      )}
    </header>
  );
}
