import { useEffect, useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackBar } from '../components/PlaybackBar';
import { RightPanel } from '../components/RightPanel';
import { Sidebar } from '../components/Sidebar';
import { SimulatorView } from '../components/SimulatorView';
import { StatusBanner } from '../components/StatusBanner';
import { PolicyToast } from '../components/PolicyToast';
import { usePlaybackLoop } from '../components/usePlayback';
import { useLabStore } from '../store/useLabStore';

export function Lab() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const scenarioName = useLabStore((s) => s.scenarioName);
  const notice = useLabStore((s) => s.notice);
  const error = useLabStore((s) => s.error);
  const clearMessage = useLabStore((s) => s.clearMessage);
  const labMode = useLabStore((s) => s.labMode);
  const setLabMode = useLabStore((s) => s.setLabMode);
  const setShortcutsOpen = useLabStore((s) => s.setShortcutsOpen);

  usePlaybackLoop();

  // Escape closes whichever mobile sheet is open (the shortcuts dialog has its own handler).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSidebarOpen(false);
      setPanelOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openSidebar = () => {
    setSidebarOpen((v) => !v);
    setPanelOpen(false);
  };

  const openPanel = () => {
    setPanelOpen((v) => !v);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-0 lg:h-[calc(100vh-56px)]">
      {/* Mobile toolbar */}
      <div className="flex lg:hidden items-center gap-8 px-16 py-8 border-b border-fog">
        <button type="button" className="btn btn-outline" aria-expanded={sidebarOpen} onClick={openSidebar}>
          Builder
        </button>
        <button type="button" className="btn btn-outline" aria-expanded={panelOpen} onClick={openPanel}>
          Analysis
        </button>
        <span className="ml-auto text-body-sm text-graphite truncate">{scenarioName}</span>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* Left sidebar */}
        <aside
          className={[
            'w-full sm:w-[320px] shrink-0 border-r border-fog bg-off-white overflow-y-auto',
            'lg:block',
            sidebarOpen ? 'block absolute inset-0 z-20 lg:static' : 'hidden',
          ].join(' ')}
          aria-label="Scenario builder"
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Center: workspace switch + canvas / simulator */}
        <main className="flex-1 min-w-0 flex flex-col" aria-label="Workspace">
          <div className="tabs shrink-0 items-center" role="tablist" aria-label="Workspace">
            <button
              type="button"
              role="tab"
              id="workspace-tab-graph"
              aria-controls="workspace-panel-graph"
              className="tab"
              aria-selected={labMode === 'graph'}
              onClick={() => setLabMode('graph')}
              data-testid="workspace-graph"
            >
              Graph
            </button>
            <button
              type="button"
              role="tab"
              id="workspace-tab-simulate"
              aria-controls="workspace-panel-simulate"
              className="tab"
              aria-selected={labMode === 'simulate'}
              onClick={() => setLabMode('simulate')}
              data-testid="workspace-simulate"
            >
              Simulator
            </button>
            <button
              type="button"
              className="btn btn-ghost ml-auto mr-8 hidden sm:inline-flex"
              onClick={() => setShortcutsOpen(true)}
              aria-haspopup="dialog"
            >
              Press ? for shortcuts
            </button>
          </div>

          {labMode === 'graph' ? (
            <div
              className="flex-1 min-h-0 relative"
              role="tabpanel"
              id="workspace-panel-graph"
              aria-labelledby="workspace-tab-graph"
              tabIndex={-1}
            >
              <GraphCanvas />
              <PlaybackBar />
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 overflow-y-auto"
              role="tabpanel"
              id="workspace-panel-simulate"
              aria-labelledby="workspace-tab-simulate"
              tabIndex={-1}
            >
              <SimulatorView />
            </div>
          )}
        </main>

        {/* Right panel */}
        <aside
          className={[
            'w-full sm:w-[380px] shrink-0 border-l border-fog bg-off-white',
            'lg:flex lg:flex-col',
            panelOpen ? 'flex flex-col absolute inset-0 z-20 lg:static' : 'hidden',
          ].join(' ')}
          aria-label="Analysis panels"
        >
          <RightPanel />
        </aside>
      </div>

      {(notice || error) && (
        <div className="flex flex-wrap items-center gap-8 p-8" role={error ? 'alert' : 'status'}>
          <span className={error ? 'chip chip-ember' : 'chip chip-amber'}>
            <span aria-hidden="true">{error ? '⚠' : 'ℹ'}</span>
            <span>{error ?? notice}</span>
          </span>
          <button type="button" className="btn btn-ghost" onClick={clearMessage}>
            dismiss
          </button>
        </div>
      )}

      <PolicyToast />
      <StatusBanner />
    </div>
  );
}
