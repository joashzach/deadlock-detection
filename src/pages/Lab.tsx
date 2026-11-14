import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackBar } from '../components/PlaybackBar';
import { RightPanel } from '../components/RightPanel';
import { Sidebar } from '../components/Sidebar';
import { SimulatorView } from '../components/SimulatorView';
import { PolicyToast } from '../components/PolicyToast';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { usePlaybackLoop } from '../components/usePlayback';
import { useLabStore, LabMode } from '../store/useLabStore';

export function Lab() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'workspace' | 'analysis'>('workspace');

  const notice = useLabStore((s) => s.notice);
  const error = useLabStore((s) => s.error);
  const clearMessage = useLabStore((s) => s.clearMessage);
  const labMode = useLabStore((s) => s.labMode);
  const setLabMode = useLabStore((s) => s.setLabMode);

  usePlaybackLoop();

  // Escape closes mobile sidebar
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const pageTitle = labMode === 'simulate' ? 'Live simulator' : 'Resource allocation graph';

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-tint-bg select-none">
      {/* Mobile Scenario drawer toggle header (<1024px) */}
      <div className="lg:hidden flex items-center justify-between px-16 py-8 border-b border-line bg-white shrink-0">
        <button
          type="button"
          className="h-[32px] px-12 border border-line bg-white font-poppins text-button text-ink hover:bg-tint-bg transition-colors cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
          aria-expanded={sidebarOpen}
          aria-label="Toggle scenario drawer"
          onClick={() => setSidebarOpen(true)}
        >
          Scenario
        </button>

        {/* Tablet/Mobile workspace vs analysis switch (<768px) */}
        <div className="md:hidden flex border border-line bg-white">
          <button
            type="button"
            className={clsx(
              'h-[32px] px-12 font-poppins text-button transition-colors',
              mobileTab === 'workspace' ? 'bg-navy text-white font-medium' : 'text-muted'
            )}
            onClick={() => setMobileTab('workspace')}
          >
            Workspace
          </button>
          <button
            type="button"
            className={clsx(
              'h-[32px] px-12 font-poppins text-button transition-colors',
              mobileTab === 'analysis' ? 'bg-navy text-white font-medium' : 'text-muted'
            )}
            onClick={() => setMobileTab('analysis')}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Main 3-column row above 32px status bar: [sidebar 280px | main 1fr | right panel 360px] */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* Sidebar: 280px on >=1280px, 250px on 1024-1279px, drawer on <1024px */}
        <aside
          className={clsx(
            'bg-white border-r border-line shrink-0 z-40',
            // Desktop >= 1024px: static column
            'hidden lg:flex lg:flex-col lg:static h-full min-h-0 w-[250px] xl:w-[280px]',
            // Mobile/Tablet: slide-out drawer
            sidebarOpen && '!flex fixed inset-y-0 left-0 w-[280px] max-w-[85vw] flex-col shadow-none z-50'
          )}
          aria-label="Scenario builder"
        >
          <Sidebar onClose={() => setSidebarOpen(false)} showUndoRedo={false} />
        </aside>

        {/* Mobile backdrop for drawer */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-ink/20"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Center / Main Workspace Column: balanced padding, relative for bottom floating notices */}
        <div
          className={clsx(
            'flex-1 min-w-0 flex flex-col overflow-hidden bg-tint-bg h-full p-12 gap-12 relative',
            mobileTab === 'analysis' && 'max-md:hidden'
          )}
        >
          {/* Title Row: Page title left, segmented control right */}
          <div className="flex items-center justify-between shrink-0">
            <h1 className="font-poppins text-[18px] font-semibold text-ink truncate">
              {pageTitle}
            </h1>

            {/* Segmented Control: Graph | Simulator (34px high) */}
            <SegmentedControl<LabMode>
              size="sm"
              options={[
                {
                  value: 'graph',
                  label: 'Graph',
                  testId: 'workspace-graph',
                  id: 'workspace-tab-graph',
                  controls: 'workspace-panel-graph',
                },
                {
                  value: 'simulate',
                  label: 'Simulator',
                  testId: 'workspace-simulate',
                  id: 'workspace-tab-simulate',
                  controls: 'workspace-panel-simulate',
                },
              ]}
              value={labMode}
              onChange={(m) => setLabMode(m)}
              ariaLabel="Workspace selector"
            />
          </div>

          {/* Toolbar */}
          <PlaybackBar />

          {/* Workspace Content: Simulator or Graph */}
          {labMode === 'graph' ? (
            <div
              className="flex-1 min-h-0 relative w-full border border-line bg-white overflow-hidden"
              role="tabpanel"
              id="workspace-panel-graph"
              aria-labelledby="workspace-tab-graph"
              tabIndex={-1}
              data-testid="graph-canvas-container"
            >
              <GraphCanvas />
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 overflow-hidden"
              role="tabpanel"
              id="workspace-panel-simulate"
              aria-labelledby="workspace-tab-simulate"
              tabIndex={-1}
            >
              <SimulatorView hideHeader />
            </div>
          )}

          {/* Floating Notice / Error banner: below legend and fit, keeping middle part static */}
          {(notice || error) && (
            <div className="absolute bottom-1 inset-x-16 z-30 flex justify-center pointer-events-none">
              <div
                className={clsx(
                  'pointer-events-auto w-full flex items-center justify-between gap-8 px-10 py-4 border shadow-sm font-mono text-[11px]',
                  error
                    ? 'border-danger/40 bg-danger-tint text-danger'
                    : 'border-warning/40 bg-warning-tint text-warning'
                )}
                role={error ? 'alert' : 'status'}
              >
                <div className="flex items-center gap-6 min-w-0">
                  <span aria-hidden="true" className="shrink-0">{error ? '⚠' : 'ℹ'}</span>
                  <span className="text-ink leading-tight">{error ?? notice}</span>
                </div>
                <button
                  type="button"
                  className="font-mono text-[11px] text-muted hover:text-ink cursor-pointer px-4 shrink-0 underline transition-colors"
                  onClick={clearMessage}
                >
                  dismiss
                </button>
              </div>
            </div>
          )}

          <PolicyToast />
        </div>

        {/* Right Panel: spacious width (330px on >=1280px, 290px on 1024-1279px) */}
        <aside
          className={clsx(
            'bg-white z-20 shrink-0 flex flex-col h-full min-h-0 border-l border-line',
            'max-md:hidden',
            mobileTab === 'analysis' && '!flex flex-1 flex-col w-full',
            'w-full md:w-full lg:w-[290px] xl:w-[330px]'
          )}
          aria-label="Analysis panels"
        >
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}
