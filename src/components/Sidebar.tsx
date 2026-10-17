import { useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import { PRESETS } from '../scenarios/presets';
import { generateRandomScenario } from '../lib/random';
import { Chip } from './ui/Primitives';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const scenario = useLabStore((s) => s.scenario);
  const selectedNodeId = useLabStore((s) => s.selectedNodeId);
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
  const undo = useLabStore((s) => s.undo);
  const redo = useLabStore((s) => s.redo);
  const past = useLabStore((s) => s.past);
  const future = useLabStore((s) => s.future);

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

  const handleRandom = () => {
    const n = Number.parseInt(seed, 10);
    const next = generateRandomScenario(Number.isFinite(n) ? n : 1);
    report(importScenario(`Random scenario (seed ${Number.isFinite(n) ? n : 1})`, next));
  };

  return (
    <div className="h-full overflow-y-auto p-16 space-y-24 text-body-sm">
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-heading">Scenario</h2>
          {onClose && (
            <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close builder panel">
              Close
            </button>
          )}
        </div>
        <label className="block mb-4 text-graphite" htmlFor="preset-select">
          Preset
        </label>
        <select
          id="preset-select"
          className="field mb-8"
          value=""
          onChange={(e) => {
            if (e.target.value) loadPreset(e.target.value);
          }}
        >
          <option value="">Choose a preset…</option>
          {Object.entries(PRESETS).map(([id, preset]) => (
            <option key={id} value={id}>
              {preset.name}
            </option>
          ))}
        </select>
        <p className="text-graphite mb-8">
          {Object.values(PRESETS).length} presets available, including the Silberschatz textbook examples.
        </p>
        <div className="flex items-end gap-8 mb-8">
          <div className="flex-1">
            <label className="block mb-4 text-graphite" htmlFor="seed-input">
              Random seed
            </label>
            <input
              id="seed-input"
              className="field"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <button type="button" className="btn btn-outline" onClick={handleRandom}>
            Random scenario
          </button>
        </div>
        <div className="flex flex-wrap gap-8">
          <button type="button" className="btn btn-outline" onClick={undo} disabled={past.length === 0}>
            Undo
          </button>
          <button type="button" className="btn btn-outline" onClick={redo} disabled={future.length === 0}>
            Redo
          </button>
          <button type="button" className="btn btn-outline" onClick={runAutoLayout}>
            Auto-layout
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetScenario}>
            Reset
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-heading">Processes ({scenario.processes.length}/20)</h2>
          <button type="button" className="btn btn-ghost" aria-label="Add process" onClick={() => report(addProcess())}>
            + Add
          </button>
        </div>
        <ul className="space-y-8">
          {scenario.processes.map((p) => (
            <li key={p.id} className="flex items-center gap-8">
              <Chip tone={selectedNodeId === p.id ? 'inverse' : 'neutral'}>
                <span className="font-semibold">{p.id}</span>
              </Chip>
              <input
                className="field flex-1"
                value={p.name}
                aria-label={`Rename ${p.id}`}
                onChange={(e) => renameProcess(p.id, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Remove ${p.id}`}
                onClick={() => report(removeProcess(p.id))}
              >
                ✕
              </button>
            </li>
          ))}
          {scenario.processes.length === 0 && <li className="text-graphite">No processes yet.</li>}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-heading">Resources ({scenario.resources.length}/20)</h2>
          <button type="button" className="btn btn-ghost" aria-label="Add resource" onClick={() => report(addResource())}>
            + Add
          </button>
        </div>
        <ul className="space-y-8">
          {scenario.resources.map((r) => (
            <li key={r.id} className="flex items-center gap-8">
              <Chip tone={selectedNodeId === r.id ? 'inverse' : 'neutral'}>
                <span className="font-semibold">{r.id}</span>
              </Chip>
              <input
                className="field flex-1"
                value={r.name}
                aria-label={`Rename ${r.id}`}
                onChange={(e) => renameResource(r.id, e.target.value)}
              />
              <input
                className="field w-[56px]"
                type="number"
                min={1}
                max={10}
                value={r.totalInstances}
                aria-label={`Instances for ${r.id}`}
                onChange={(e) => report(setResourceInstances(r.id, Number(e.target.value)))}
              />
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Remove ${r.id}`}
                onClick={() => report(removeResource(r.id))}
              >
                ✕
              </button>
            </li>
          ))}
          {scenario.resources.length === 0 && <li className="text-graphite">No resources yet.</li>}
        </ul>
      </section>

      <section>
        <h2 className="section-heading mb-8">Edges</h2>

        <div className="panel p-16 mb-16">
          <p className="font-semibold text-ink-black mb-8">New request edge (P → R)</p>
          <div className="grid grid-cols-3 gap-8 mb-8">
            <select className="field" value={reqProcess} aria-label="Requesting process" onChange={(e) => setReqProcess(e.target.value)}>
              <option value="">Process…</option>
              {scenario.processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}
                </option>
              ))}
            </select>
            <select className="field" value={reqResource} aria-label="Requested resource" onChange={(e) => setReqResource(e.target.value)}>
              <option value="">Resource…</option>
              {scenario.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
            </select>
            <input className="field" type="number" min={1} value={reqCount} aria-label="Request count" onChange={(e) => setReqCount(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!reqProcess || !reqResource}
            onClick={() => {
              report(addRequestEdge(reqProcess, reqResource, Number(reqCount)));
            }}
          >
            Add request
          </button>
        </div>

        <div className="panel p-16 mb-16">
          <p className="font-semibold text-ink-black mb-8">New assignment edge (R → P)</p>
          <div className="grid grid-cols-3 gap-8 mb-8">
            <select className="field" value={asgResource} aria-label="Assigned resource" onChange={(e) => setAsgResource(e.target.value)}>
              <option value="">Resource…</option>
              {scenario.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
            </select>
            <select className="field" value={asgProcess} aria-label="Receiving process" onChange={(e) => setAsgProcess(e.target.value)}>
              <option value="">Process…</option>
              {scenario.processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}
                </option>
              ))}
            </select>
            <input className="field" type="number" min={1} value={asgCount} aria-label="Assignment count" onChange={(e) => setAsgCount(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!asgProcess || !asgResource}
            onClick={() => {
              report(addAssignmentEdge(asgResource, asgProcess, Number(asgCount)));
            }}
          >
            Add assignment
          </button>
        </div>

        {edgeMessage && (
          <p className="chip chip-ember mb-8" role="alert">
            ⚠ {edgeMessage}
          </p>
        )}

        <ul className="space-y-4">
          {scenario.edges.map((edge) => (
            <li key={edge.id} className="flex items-center justify-between gap-8">
              <span>
                {edge.from} → {edge.to}{' '}
                <span className="text-graphite">
                  ({edge.type === 'request' ? 'request' : 'assignment'}
                  {edge.count > 1 ? `, ×${edge.count}` : ''})
                </span>
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Remove edge ${edge.from} to ${edge.to}`}
                onClick={() => report(removeEdge(edge.id))}
              >
                ✕
              </button>
            </li>
          ))}
          {scenario.edges.length === 0 && <li className="text-graphite">No edges yet.</li>}
        </ul>
      </section>
    </div>
  );
}
