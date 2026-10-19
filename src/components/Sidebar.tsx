import { useRef, useState } from 'react';
import clsx from 'clsx';
import { useLabStore, AlgorithmChoice } from '../store/useLabStore';
import { PRESETS } from '../scenarios/presets';
import { generateRandomScenario } from '../lib/random';
import { serializeScenario, parseScenarioJson } from '../lib/schema';
import { PreventionPanel } from './PreventionPanel';
import { BankersPanel } from './BankersPanel';
import { RecoveryPanel } from './RecoveryPanel';
import { Button } from './ui/Button';
import { AccordionRow } from './ui/AccordionRow';

type SectionKey = 'processes' | 'resources' | 'scripts' | 'policies' | 'advanced';

export function Sidebar({
  onClose,
  showUndoRedo = true,
}: {
  onClose?: () => void;
  showUndoRedo?: boolean;
}) {
  const scenario = useLabStore((s) => s.scenario);
  const scenarioId = useLabStore((s) => s.scenarioId);
  const scenarioName = useLabStore((s) => s.scenarioName);
  const selectedNodeId = useLabStore((s) => s.selectedNodeId);
  const algorithm = useLabStore((s) => s.algorithm);
  const setAlgorithm = useLabStore((s) => s.setAlgorithm);
  const loadPreset = useLabStore((s) => s.loadPreset);
  const importScenario = useLabStore((s) => s.importScenario);
  const resetScenario = useLabStore((s) => s.resetScenario);
  const addProcess = useLabStore((s) => s.addProcess);
  const removeProcess = useLabStore((s) => s.removeProcess);
  const renameProcess = useLabStore((s) => s.renameProcess);
  const addResource = useLabStore((s) => s.addResource);
  const removeResource = useLabStore((s) => s.removeResource);
  const renameResource = useLabStore((s) => s.renameResource);
  const setResourceInstances = useLabStore((s) => s.setResourceInstances);
  const addRequestEdge = useLabStore((s) => s.addRequestEdge);
  const addAssignmentEdge = useLabStore((s) => s.addAssignmentEdge);
  const removeEdge = useLabStore((s) => s.removeEdge);
  const runAutoLayout = useLabStore((s) => s.runAutoLayout);
  const policies = useLabStore((s) => s.policies);
  const undo = useLabStore((s) => s.undo);
  const redo = useLabStore((s) => s.redo);
  const past = useLabStore((s) => s.past);
  const future = useLabStore((s) => s.future);

  const fileRef = useRef<HTMLInputElement>(null);

  const activePolicies =
    (policies.breakHoldAndWait ? 1 : 0) +
    (policies.breakNoPreemption ? 1 : 0) +
    (policies.breakCircularWait ? 1 : 0);

  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const [seed, setSeed] = useState('1');
  const [reqProcess, setReqProcess] = useState('');
  const [reqResource, setReqResource] = useState('');
  const [reqCount, setReqCount] = useState('1');
  const [asgProcess, setAsgProcess] = useState('');
  const [asgResource, setAsgResource] = useState('');
  const [asgCount, setAsgCount] = useState('1');
  const [edgeMessage, setEdgeMessage] = useState<string | null>(null);

  const report = (result: { ok: boolean; error?: string }) => {
    setEdgeMessage(result.ok ? null : (result.error ?? 'Invalid operation'));
  };

  const toggleSection = (section: SectionKey) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const handleRandom = () => {
    const n = Number.parseInt(seed, 10);
    const next = generateRandomScenario(Number.isFinite(n) ? n : 1);
    report(importScenario(`Random scenario (seed ${Number.isFinite(n) ? n : 1})`, next));
  };

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
    if (!result.ok || !result.scenario) return;
    importScenario(result.name ?? 'Imported scenario', result.scenario);
  };

  return (
    <div
      className="h-full flex flex-col bg-white text-ink select-none overflow-hidden"
      data-testid="sidebar-container"
    >
      {/* Scrollable upper area: anchored to top, overflow-anchor: none */}
      <div
        className="flex-1 overflow-y-auto font-mono text-[14px]"
        style={{ padding: '24px', overflowAnchor: 'none' }}
        data-testid="sidebar-scrollable"
      >
        {/* SCENARIO label */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-poppins text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            SCENARIO
          </span>
          {onClose && (
            <button
              type="button"
              className="lg:hidden h-32 w-32 flex items-center justify-center font-mono text-muted hover:text-ink cursor-pointer text-[14px]"
              onClick={onClose}
              aria-label="Close scenario panel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Preset Select: var(--ctrl-h), left-aligned */}
        <div className="mb-8">
          <select
            id="preset-select"
            aria-label="Preset"
            className="w-full h-[40px] px-[14px] text-left bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none focus:border-navy cursor-pointer"
            value={scenarioId}
            onChange={(e) => {
              if (e.target.value && e.target.value !== 'custom') loadPreset(e.target.value);
            }}
          >
            {scenarioId === 'custom' && <option value="custom">Custom</option>}
            {Object.entries(PRESETS).map(([id, preset]) => (
              <option key={id} value={id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row of two equal buttons: Auto-layout and Reset */}
        <div className="grid grid-cols-2 gap-8 mb-24">
          <Button
            variant="secondary"
            size="compact"
            className="w-full !px-8 whitespace-nowrap text-[13px] h-[40px]"
            onClick={runAutoLayout}
          >
            Auto-layout
          </Button>
          <Button
            variant="secondary"
            size="compact"
            className="w-full !px-8 whitespace-nowrap text-[13px] h-[40px]"
            onClick={resetScenario}
          >
            Reset
          </Button>
        </div>

        {/* ALGORITHM label */}
        <div className="mb-8">
          <span className="font-poppins text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            ALGORITHM
          </span>
        </div>

        {/* Algorithm Select: var(--ctrl-h), left-aligned, options short enough to fit */}
        <div className="mb-24">
          <select
            id="algorithm-select"
            aria-label="Algorithm"
            className="w-full h-[40px] px-[14px] text-left bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none focus:border-navy cursor-pointer"
            value={algorithm}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'bankers') {
                setAlgorithm('multi-instance-matrix');
                useLabStore.getState().runSafety();
              } else {
                setAlgorithm(val as AlgorithmChoice);
              }
            }}
          >
            <option value="auto">Auto</option>
            <option value="single-instance-wfg">Wait-for graph</option>
            <option value="multi-instance-matrix">Matrix</option>
            <option value="bankers">Banker's</option>
          </select>
        </div>

        {/* Accordion Rows: height 44px, rotating chevron, only one open at a time */}
        <div className="border-b border-line">
          {/* 1. Processes */}
          <AccordionRow
            label="Processes"
            count={scenario.processes.length}
            isOpen={openSection === 'processes'}
            onToggle={() => toggleSection('processes')}
          >
            <Button
              variant="secondary"
              className="w-full h-[40px]"
              aria-label="Add process"
              onClick={() => report(addProcess())}
            >
              + Add process
            </Button>
            <ul className="space-y-8 max-h-[240px] overflow-y-auto pr-4">
              {scenario.processes.map((p) => (
                <li key={p.id} className="flex items-center gap-8">
                  <span
                    className={clsx(
                      'w-32 h-32 flex items-center justify-center border font-mono text-[13px] font-medium shrink-0',
                      selectedNodeId === p.id
                        ? 'border-navy bg-navy text-white'
                        : 'border-line bg-tint-bg text-ink'
                    )}
                  >
                    {p.id}
                  </span>
                  <input
                    className="w-full h-[40px] px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy"
                    value={p.name}
                    aria-label={`Rename ${p.id}`}
                    onChange={(e) => renameProcess(p.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="font-mono text-[13px] text-muted hover:text-danger px-8 py-4 shrink-0 cursor-pointer"
                    aria-label={`Remove ${p.id}`}
                    onClick={() => report(removeProcess(p.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {scenario.processes.length === 0 && (
                <li className="text-muted text-[13px]">No processes defined.</li>
              )}
            </ul>
          </AccordionRow>

          {/* 2. Resources */}
          <AccordionRow
            label="Resources"
            count={scenario.resources.length}
            isOpen={openSection === 'resources'}
            onToggle={() => toggleSection('resources')}
          >
            <Button
              variant="secondary"
              className="w-full h-[40px]"
              aria-label="Add resource"
              onClick={() => report(addResource())}
            >
              + Add resource
            </Button>
            <ul className="space-y-8 max-h-[240px] overflow-y-auto pr-4">
              {scenario.resources.map((r) => (
                <li key={r.id} className="flex items-center gap-8">
                  <span
                    className={clsx(
                      'w-32 h-32 flex items-center justify-center border font-mono text-[13px] font-medium shrink-0',
                      selectedNodeId === r.id
                        ? 'border-navy bg-navy text-white'
                        : 'border-line bg-tint-bg text-ink'
                    )}
                  >
                    {r.id}
                  </span>
                  <input
                    className="w-full h-[40px] px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy"
                    value={r.name}
                    aria-label={`Rename ${r.id}`}
                    onChange={(e) => renameResource(r.id, e.target.value)}
                  />
                  <input
                    className="w-[56px] h-[40px] text-center bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy shrink-0"
                    type="number"
                    min={1}
                    max={10}
                    value={r.totalInstances}
                    aria-label={`Instances for ${r.id}`}
                    onChange={(e) =>
                      report(setResourceInstances(r.id, Number(e.target.value)))
                    }
                  />
                  <button
                    type="button"
                    className="font-mono text-[13px] text-muted hover:text-danger px-8 py-4 shrink-0 cursor-pointer"
                    aria-label={`Remove ${r.id}`}
                    onClick={() => report(removeResource(r.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {scenario.resources.length === 0 && (
                <li className="text-muted text-[13px]">No resources defined.</li>
              )}
            </ul>
          </AccordionRow>

          {/* 3. Scripts */}
          <AccordionRow
            label="Scripts"
            count={scenario.edges.length}
            isOpen={openSection === 'scripts'}
            onToggle={() => toggleSection('scripts')}
          >
            <div className="border border-line p-12 bg-white space-y-8">
              <p className="font-semibold text-ink text-[13px]">Request edge (P → R)</p>
              <div className="grid grid-cols-3 gap-6">
                <select
                  className="h-[40px] px-8 bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none"
                  value={reqProcess}
                  aria-label="Requesting process"
                  onChange={(e) => setReqProcess(e.target.value)}
                >
                  <option value="">Process…</option>
                  {scenario.processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
                <select
                  className="h-[40px] px-8 bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none"
                  value={reqResource}
                  aria-label="Requested resource"
                  onChange={(e) => setReqResource(e.target.value)}
                >
                  <option value="">Resource…</option>
                  {scenario.resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}
                    </option>
                  ))}
                </select>
                <input
                  className="h-[40px] px-8 bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none text-center"
                  type="number"
                  min={1}
                  value={reqCount}
                  aria-label="Request count"
                  onChange={(e) => setReqCount(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="compact"
                className="w-full h-[40px]"
                disabled={!reqProcess || !reqResource}
                onClick={() => report(addRequestEdge(reqProcess, reqResource, Number(reqCount)))}
              >
                Add request
              </Button>
            </div>

            <div className="border border-line p-12 bg-white space-y-8">
              <p className="font-semibold text-ink text-[13px]">Assignment edge (R → P)</p>
              <div className="grid grid-cols-3 gap-6">
                <select
                  className="h-[40px] px-8 bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none"
                  value={asgResource}
                  aria-label="Assigned resource"
                  onChange={(e) => setAsgResource(e.target.value)}
                >
                  <option value="">Resource…</option>
                  {scenario.resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}
                    </option>
                  ))}
                </select>
                <select
                  className="h-[40px] px-8 bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none"
                  value={asgProcess}
                  aria-label="Receiving process"
                  onChange={(e) => setAsgProcess(e.target.value)}
                >
                  <option value="">Process…</option>
                  {scenario.processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
                <input
                  className="h-[40px] px-8 bg-white font-mono text-[13px] text-ink border border-line rounded-none outline-none text-center"
                  type="number"
                  min={1}
                  value={asgCount}
                  aria-label="Assignment count"
                  onChange={(e) => setAsgCount(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="compact"
                className="w-full h-[40px]"
                disabled={!asgProcess || !asgResource}
                onClick={() => report(addAssignmentEdge(asgResource, asgProcess, Number(asgCount)))}
              >
                Add assignment
              </Button>
            </div>

            {edgeMessage && (
              <p className="p-8 border border-danger bg-danger-tint text-danger text-[13px]" role="alert">
                ⚠ {edgeMessage}
              </p>
            )}

            <ul className="space-y-4 max-h-[240px] overflow-y-auto pr-4">
              {scenario.edges.map((edge) => (
                <li
                  key={edge.id}
                  className="flex items-center justify-between gap-8 text-[13px] border-b border-line pb-4"
                >
                  <span>
                    {edge.from} → {edge.to}{' '}
                    <span className="text-muted">
                      ({edge.type}
                      {edge.count > 1 ? ` ×${edge.count}` : ''})
                    </span>
                  </span>
                  <button
                    type="button"
                    className="font-mono text-muted hover:text-danger px-4 py-2 cursor-pointer"
                    aria-label={`Remove edge ${edge.from} to ${edge.to}`}
                    onClick={() => report(removeEdge(edge.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {scenario.edges.length === 0 && (
                <li className="text-muted text-[13px]">No edges defined.</li>
              )}
            </ul>
          </AccordionRow>

          {/* 4. Policies */}
          <AccordionRow
            label="Policies"
            count={activePolicies > 0 ? `${activePolicies} on` : undefined}
            isOpen={openSection === 'policies'}
            onToggle={() => toggleSection('policies')}
          >
            <div className="space-y-16">
              <PreventionPanel />
              <BankersPanel />
            </div>
          </AccordionRow>

          {/* 5. Advanced */}
          <AccordionRow
            label="Advanced"
            isOpen={openSection === 'advanced'}
            onToggle={() => toggleSection('advanced')}
          >
            <div className="space-y-16">
              <div className="border border-line p-12 bg-white">
                <label className="block mb-4 text-muted text-[13px]" htmlFor="seed-input">
                  Random seed
                </label>
                <div className="flex gap-8">
                  <input
                    id="seed-input"
                    className="w-full h-[40px] px-12 bg-white font-mono text-[14px] text-ink border border-line rounded-none outline-none focus:border-navy"
                    value={seed}
                    aria-label="Random seed"
                    onChange={(e) => setSeed(e.target.value)}
                    inputMode="numeric"
                  />
                  <Button
                    variant="secondary"
                    size="compact"
                    className="whitespace-nowrap h-[40px]"
                    onClick={handleRandom}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <RecoveryPanel />
            </div>
          </AccordionRow>
        </div>
      </div>

      {/* Pinned to the bottom: Import and Export secondary buttons */}
      <div
        className="border-t border-line bg-white shrink-0 flex gap-8 box-border w-full"
        style={{ padding: '24px' }}
      >
        <Button
          variant="secondary"
          className="flex-1 h-[40px]"
          onClick={() => fileRef.current?.click()}
          aria-label="Import a scenario from a JSON file"
        >
          Import
        </Button>
        <Button
          variant="secondary"
          className="flex-1 h-[40px]"
          onClick={handleExport}
          aria-label="Export this scenario as JSON"
        >
          Export
        </Button>
      </div>

      {/* Hidden file input for Import */}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        className="sr-only"
        aria-label="Import scenario JSON file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = '';
        }}
      />

      {/* Screen-reader accessible undo/redo buttons if showUndoRedo is enabled */}
      {showUndoRedo && (
        <div className="sr-only">
          <button type="button" onClick={undo} disabled={past.length === 0} aria-label="Undo">
            Undo
          </button>
          <button type="button" onClick={redo} disabled={future.length === 0} aria-label="Redo">
            Redo
          </button>
        </div>
      )}
    </div>
  );
}
