import { useRef, useState } from 'react';
import clsx from 'clsx';
import { useLabStore, AlgorithmChoice } from '../store/useLabStore';
import { PRESETS } from '../scenarios/presets';
import { generateRandomScenario } from '../lib/random';
import { serializeScenario, parseScenarioJson } from '../lib/schema';
import { PreventionPanel } from './PreventionPanel';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { AccordionRow } from './ui/AccordionRow';
import { CloseIcon } from './ui/Icons';

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

  // Preset Select Options
  const presetOptions = [
    ...(scenarioId === 'custom' ? [{ value: 'custom', label: 'Custom' }] : []),
    ...Object.entries(PRESETS).map(([id, preset]) => ({
      value: id,
      label: preset.name,
    })),
  ];

  // Algorithm Select Options
  const algorithmOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'single-instance-wfg', label: 'Wait-for graph' },
    { value: 'multi-instance-matrix', label: 'Matrix' },
    { value: 'bankers', label: "Banker's" },
  ];

  const currentAlgorithmValue =
    algorithm === 'multi-instance-matrix' && useLabStore.getState().traceKind === 'banker-safety'
      ? 'bankers'
      : algorithm;

  return (
    <div
      className="h-full flex flex-col bg-white text-ink select-none overflow-hidden"
      data-testid="sidebar-container"
    >
      {/* Scrollable Upper Area: scrollable only when dropdown menus/accordions are expanded */}
      <div
        className={clsx(
          'flex-1 font-mono text-[13px] px-16 py-12',
          openSection !== null ? 'overflow-y-auto' : 'overflow-hidden'
        )}
        style={{ overflowAnchor: 'none' }}
        data-testid="sidebar-scrollable"
      >
        {/* SCENARIO label */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-poppins text-label uppercase text-muted tracking-wider">
            SCENARIO
          </span>
          {onClose && (
            <button
              type="button"
              className="lg:hidden h-28 w-28 flex items-center justify-center font-mono text-muted hover:text-ink cursor-pointer text-[13px]"
              onClick={onClose}
              aria-label="Close scenario panel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Preset Select: compact 32px height, full width */}
        <div className="mb-10">
          <Select
            id="preset-select"
            ariaLabel="Preset"
            value={scenarioId}
            options={presetOptions}
            sizeVariant="sm"
            onChange={(val) => {
              if (val && val !== 'custom') loadPreset(val);
            }}
          />
        </div>

        {/* Auto-layout | Reset: two equal buttons on ONE line (sm = 32px, gap 8) */}
        <div className="grid grid-cols-2 gap-8 mb-16">
          <Button
            variant="secondary"
            size="sm"
            className="w-full whitespace-nowrap text-[12px] font-medium h-[32px] px-8"
            onClick={runAutoLayout}
          >
            Auto-layout
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full whitespace-nowrap text-[12px] font-medium h-[32px] px-8"
            onClick={resetScenario}
          >
            Reset
          </Button>
        </div>

        {/* ALGORITHM label */}
        <div className="mb-6">
          <span className="font-poppins text-label uppercase text-muted tracking-wider">
            ALGORITHM
          </span>
        </div>

        {/* Algorithm Select: compact 32px height, full width */}
        <div className="mb-16">
          <Select
            id="algorithm-select"
            ariaLabel="Algorithm"
            value={currentAlgorithmValue}
            options={algorithmOptions}
            sizeVariant="sm"
            onChange={(val) => {
              if (val === 'bankers') {
                setAlgorithm('multi-instance-matrix');
                useLabStore.getState().runSafety();
              } else {
                setAlgorithm(val as AlgorithmChoice);
              }
            }}
          />
        </div>

        {/* Accordion Rows: 44px headers, top-anchored, only one open at a time */}
        <div className="border-b border-line">
          {/* 1. Processes */}
          <AccordionRow
            label="Processes"
            count={scenario.processes.length}
            isOpen={openSection === 'processes'}
            onToggle={() => toggleSection('processes')}
          >
            <div className="space-y-8">
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-[32px] text-[12px] font-medium"
                aria-label="Add process"
                onClick={() => report(addProcess())}
              >
                + Add process
              </Button>
              <ul className="space-y-8 max-h-[240px] overflow-y-auto pr-2">
                {scenario.processes.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[32px_minmax(0,1fr)_32px] gap-6 items-center"
                  >
                    <span className="w-[32px] h-[32px] border border-line bg-tint-bg font-mono text-[12px] font-medium text-ink flex items-center justify-center shrink-0">
                      {p.id}
                    </span>
                    <input
                      className="w-full h-[32px] px-8 bg-white font-mono text-[12px] text-ink border border-line rounded-none outline-none focus:border-navy"
                      value={p.name}
                      aria-label={`Rename ${p.id}`}
                      onChange={(e) => renameProcess(p.id, e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="h-[32px] w-[32px] shrink-0"
                      aria-label={`Remove ${p.id}`}
                      onClick={() => report(removeProcess(p.id))}
                    >
                      <CloseIcon size={16} />
                    </Button>
                  </li>
                ))}
                {scenario.processes.length === 0 && (
                  <li className="text-muted text-[12px] py-4">No processes defined.</li>
                )}
              </ul>
            </div>
          </AccordionRow>

          {/* 2. Resources */}
          <AccordionRow
            label="Resources"
            count={scenario.resources.length}
            isOpen={openSection === 'resources'}
            onToggle={() => toggleSection('resources')}
          >
            <div className="space-y-8">
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-[32px] text-[12px] font-medium"
                aria-label="Add resource"
                onClick={() => report(addResource())}
              >
                + Add resource
              </Button>
              <ul className="space-y-8 max-h-[240px] overflow-y-auto pr-2">
                {scenario.resources.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-[32px_minmax(0,1fr)_44px_32px] gap-6 items-center"
                  >
                    <span className="w-[32px] h-[32px] border border-line bg-tint-bg font-mono text-[12px] font-medium text-ink flex items-center justify-center shrink-0">
                      {r.id}
                    </span>
                    <input
                      className="w-full h-[32px] px-8 bg-white font-mono text-[12px] text-ink border border-line rounded-none outline-none focus:border-navy"
                      value={r.name}
                      aria-label={`Rename ${r.id}`}
                      onChange={(e) => renameResource(r.id, e.target.value)}
                    />
                    <input
                      className="w-[44px] h-[32px] px-4 text-center bg-white font-mono text-[12px] text-ink border border-line rounded-none outline-none focus:border-navy shrink-0 [appearance:textfield]"
                      type="number"
                      min={1}
                      max={10}
                      value={r.totalInstances}
                      aria-label={`Instances for ${r.id}`}
                      title="Total instances"
                      onChange={(e) =>
                        report(setResourceInstances(r.id, Number(e.target.value)))
                      }
                    />
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="h-[32px] w-[32px] shrink-0"
                      aria-label={`Remove ${r.id}`}
                      onClick={() => report(removeResource(r.id))}
                    >
                      <CloseIcon size={16} />
                    </Button>
                  </li>
                ))}
                {scenario.resources.length === 0 && (
                  <li className="text-muted text-[12px] py-4">No resources defined.</li>
                )}
              </ul>
            </div>
          </AccordionRow>

          {/* 3. Scripts */}
          <AccordionRow
            label="Scripts"
            count={scenario.edges.length}
            isOpen={openSection === 'scripts'}
            onToggle={() => toggleSection('scripts')}
          >
            <div className="space-y-16">
              {/* Section 1: Request edge P to R */}
              <div className="space-y-8">
                <span className="font-poppins text-label uppercase text-muted block tracking-wider">
                  Request edge (P → R)
                </span>
                <div className="grid grid-cols-2 gap-8 items-center">
                  <Select
                    sizeVariant="sm"
                    menuAlign="left"
                    value={reqProcess}
                    placeholder="Process…"
                    ariaLabel="Requesting process"
                    options={[
                      { value: '', label: 'Process…' },
                      ...scenario.processes.map((p) => ({ value: p.id, label: p.id })),
                    ]}
                    onChange={setReqProcess}
                  />
                  <Select
                    sizeVariant="sm"
                    menuAlign="right"
                    value={reqResource}
                    placeholder="Resource…"
                    ariaLabel="Requested resource"
                    options={[
                      { value: '', label: 'Resource…' },
                      ...scenario.resources.map((r) => ({ value: r.id, label: r.id })),
                    ]}
                    onChange={setReqResource}
                  />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-8 items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-[32px] text-[12px] font-medium"
                    disabled={!reqProcess || !reqResource}
                    onClick={() => report(addRequestEdge(reqProcess, reqResource, Number(reqCount)))}
                  >
                    Add request
                  </Button>
                  <input
                    className="w-[56px] h-[32px] px-6 bg-white font-mono text-[12px] text-ink border border-line rounded-none outline-none text-center shrink-0 focus:border-navy"
                    type="number"
                    min={1}
                    value={reqCount}
                    aria-label="Request count"
                    title="Request count"
                    onChange={(e) => setReqCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-line" />

              {/* Section 2: Assignment edge R to P */}
              <div className="space-y-8">
                <span className="font-poppins text-label uppercase text-muted block tracking-wider">
                  Assignment edge (R → P)
                </span>
                <div className="grid grid-cols-2 gap-8 items-center">
                  <Select
                    sizeVariant="sm"
                    menuAlign="left"
                    value={asgResource}
                    placeholder="Resource…"
                    ariaLabel="Assigned resource"
                    options={[
                      { value: '', label: 'Resource…' },
                      ...scenario.resources.map((r) => ({ value: r.id, label: r.id })),
                    ]}
                    onChange={setAsgResource}
                  />
                  <Select
                    sizeVariant="sm"
                    menuAlign="right"
                    value={asgProcess}
                    placeholder="Process…"
                    ariaLabel="Receiving process"
                    options={[
                      { value: '', label: 'Process…' },
                      ...scenario.processes.map((p) => ({ value: p.id, label: p.id })),
                    ]}
                    onChange={setAsgProcess}
                  />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-8 items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-[32px] text-[12px] font-medium"
                    disabled={!asgProcess || !asgResource}
                    onClick={() => report(addAssignmentEdge(asgResource, asgProcess, Number(asgCount)))}
                  >
                    Add assignment
                  </Button>
                  <input
                    className="w-[56px] h-[32px] px-6 bg-white font-mono text-[12px] text-ink border border-line rounded-none outline-none text-center shrink-0 focus:border-navy"
                    type="number"
                    min={1}
                    value={asgCount}
                    aria-label="Assignment count"
                    title="Assignment count"
                    onChange={(e) => setAsgCount(e.target.value)}
                  />
                </div>
              </div>

              {edgeMessage && (
                <p className="p-8 border border-danger/30 bg-danger-tint text-danger font-mono text-[11px]" role="alert">
                  ⚠ {edgeMessage}
                </p>
              )}

              <div className="border-t border-line" />

              {/* Edges List */}
              <div className="space-y-4">
                <span className="font-poppins text-label uppercase text-muted block tracking-wider">
                  EDGES
                </span>
                <ul className="space-y-4 max-h-[240px] overflow-y-auto pr-2 divide-y divide-line">
                  {scenario.edges.map((edge) => (
                    <li
                      key={edge.id}
                      className="flex items-center justify-between gap-8 pt-4 first:pt-0 font-mono text-[12px] font-normal"
                    >
                      <span className="truncate">
                        {edge.from} → {edge.to}{' '}
                        <span className="text-muted">
                          ({edge.type}
                          {edge.count > 1 ? ` ×${edge.count}` : ''})
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-[28px] w-[28px] shrink-0 text-muted hover:text-danger"
                        aria-label={`Remove edge ${edge.from} to ${edge.to}`}
                        onClick={() => report(removeEdge(edge.id))}
                      >
                        <CloseIcon size={14} />
                      </Button>
                    </li>
                  ))}
                  {scenario.edges.length === 0 && (
                    <li className="text-muted text-[12px] font-mono py-4">No edges defined.</li>
                  )}
                </ul>
              </div>
            </div>
          </AccordionRow>

          {/* 4. Policies */}
          <AccordionRow
            label="Policies"
            count={activePolicies > 0 ? `${activePolicies} on` : undefined}
            isOpen={openSection === 'policies'}
            onToggle={() => toggleSection('policies')}
          >
            <PreventionPanel />
          </AccordionRow>

          {/* 5. Advanced */}
          <AccordionRow
            label="Advanced"
            isOpen={openSection === 'advanced'}
            onToggle={() => toggleSection('advanced')}
          >
            <div className="space-y-8">
              <label className="font-poppins text-label uppercase text-muted block tracking-wider" htmlFor="seed-input">
                Random seed
              </label>
              <input
                id="seed-input"
                className="w-full h-[32px] px-8 bg-white font-mono text-[12px] text-ink border border-line rounded-none outline-none focus:border-navy"
                value={seed}
                aria-label="Random seed"
                onChange={(e) => setSeed(e.target.value)}
                inputMode="numeric"
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-[32px] text-[12px] font-medium"
                onClick={handleRandom}
              >
                Random scenario
              </Button>
            </div>
          </AccordionRow>
        </div>
      </div>

      {/* Pinned Footer at Bottom: Import | Export compact secondary buttons */}
      <div
        className="border-t border-line bg-white shrink-0 grid grid-cols-2 gap-8 box-border w-full px-16 py-12"
      >
        <Button
          variant="secondary"
          size="sm"
          className="w-full h-[32px] text-[12px] font-medium"
          onClick={() => fileRef.current?.click()}
          aria-label="Import a scenario from a JSON file"
        >
          Import
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-full h-[32px] text-[12px] font-medium"
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
