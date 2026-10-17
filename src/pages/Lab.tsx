import { useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackBar } from '../components/PlaybackBar';
import { RightPanel } from '../components/RightPanel';
import { Sidebar } from '../components/Sidebar';
import { StatusBanner } from '../components/StatusBanner';
import { useLabStore } from '../store/useLabStore';

export function Lab() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const scenarioName = useLabStore((s) => s.scenarioName);
  const notice = useLabStore((s) => s.notice);
  const error = useLabStore((s) => s.error);
  const clearMessage = useLabStore((s) => s.clearMessage);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] min-h-0">
      {/* Mobile toolbar */}
      <div className="lg:hidden flex items-center gap-8 px-16 py-8 border-b border-fog">
        <button
          type="button"
          className="btn btn-outline"
          aria-expanded={sidebarOpen}
          onClick={() => {
            setSidebarOpen((v) => !v);
            setPanelOpen(false);
          }}
        >
          Builder
        </button>
        <button
          type="button"
          className="btn btn-outline"
          aria-expanded={panelOpen}
          onClick={() => {
            setPanelOpen((v) => !v);
            setSidebarOpen(false);
          }}
        >
          Analysis
        </button>
        <span className="ml-auto text-body-sm text-graphite truncate">{scenarioName}</span>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* Left sidebar */}
        <aside
          className={[
            'w-[320px] shrink-0 border-r border-fog bg-off-white overflow-y-auto',
            'lg:block',
            sidebarOpen
              ? 'block absolute inset-0 z-20 lg:static'
              : 'hidden',
          ].join(' ')}
          aria-label="Scenario builder"
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Center: canvas + playback */}
        <main className="flex-1 min-w-0 relative" aria-label="Graph canvas">
          <GraphCanvas />
          <PlaybackBar />
        </main>

        {/* Right panel */}
        <aside
          className={[
            'w-[380px] shrink-0 border-l border-fog bg-off-white',
            'lg:flex lg:flex-col',
            panelOpen ? 'flex flex-col absolute inset-0 z-20 lg:static' : 'hidden',
          ].join(' ')}
          aria-label="Analysis panels"
        >
          <RightPanel />
        </aside>
      </div>

      {(notice || error) && (
        <div
          className={error ? 'chip chip-ember m-8' : 'chip chip-amber m-8'}
          role={error ? 'alert' : 'status'}
        >
          <span aria-hidden="true">{error ? '⚠' : 'ℹ'}</span>
          <span>{error ?? notice}</span>
          <button type="button" className="underline ml-8" onClick={clearMessage}>
            dismiss
          </button>
        </div>
      )}

      <StatusBanner />
    </div>
  );
}
