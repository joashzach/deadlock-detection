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
  const undo = useLabStore((s) => s.undo);
  const redo = useLabStore((s) => s.redo);
  const pastLength = useLabStore((s) => s.past.length);
  const futureLength = useLabStore((s) => s.future.length);
  const shortcutsOpen = useLabStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useLabStore((s) => s.setShortcutsOpen);
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const single = isSingleInstanceSystem(scenario);
  const inLab = location.pathname.startsWith('/lab');

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
      <div className="flex flex-wrap items-center gap-x-16 gap-y-8 px-16 py-8 min-h-[56px]">
        <Link to="/" className="font-semibold text-ink-black no-underline shrink-0" aria-label="DeadlockLab home">
          deadlocklab
        </Link>

        <nav
          className="order-last w-full md:order-none md:w-auto flex items-center gap-16 overflow-x-auto"
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const current = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={current ? 'page' : undefined}
                className={
                  current
                    ? 'text-ink-black font-semibold no-underline whitespace-nowrap'
                    : 'text-charcoal no-underline hover:underline whitespace-nowrap'
                }
              >
                {item.label}
              </Link>
            );
          })}
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

        {inLab && (
          <div className="hidden sm:flex items-center gap-8">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={undo}
              disabled={pastLength === 0}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={redo}
              disabled={futureLength === 0}
              title="Redo (Ctrl+Shift+Z)"
            >
              Redo
            </button>
          </div>
        )}

        <div className="flex items-center gap-8">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
            aria-label="Import a scenario from a JSON file"
          >
            Import
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleExport} aria-label="Export this scenario as JSON">
            Export
          </button>
        </div>

        <button
          type="button"
          className="btn btn-outline shrink-0"
          onClick={() => setShortcutsOpen(!shortcutsOpen)}
          aria-haspopup="dialog"
          aria-expanded={shortcutsOpen}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>

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
