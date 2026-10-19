import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackBar } from '../components/PlaybackBar';
import { RightPanel } from '../components/RightPanel';
import { Sidebar } from '../components/Sidebar';
import { SimulatorView } from '../components/SimulatorView';
import { StatusBanner } from '../components/StatusBanner';
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-tint-bg select-none">
      {/* Mobile / Tablet Scenario drawer toggle header */}
      <div className="lg:hidden flex items-center justify-between px-16 py-8 border-b border-line bg-white shrink-0">
        <button
          type="button"
          className="h-32 px-12 border border-line bg-white font-poppins text-[13px] text-ink hover:bg-tint-bg transition-colors cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
          aria-expanded={sidebarOpen}
          aria-label="Toggle scenario drawer"
          onClick={() => setSidebarOpen(true)}
        >
          Scenario
        </button>

        {/* Tablet/Mobile workspace vs analysis switch */}
        <div className="md:hidden flex border border-line bg-white">
          <button
            type="button"
            className={clsx(
              'h-32 px-12 font-poppins text-[13px] transition-colors',
              mobileTab === 'workspace' ? 'bg-navy text-white font-medium' : 'text-muted'
            )}
            onClick={() => setMobileTab('workspace')}
          >
            Workspace
          </button>
          <button
            type="button"
            className={clsx(
              'h-32 px-12 font-poppins text-[13px] transition-colors',
              mobileTab === 'analysis' ? 'bg-navy text-white font-medium' : 'text-muted'
            )}
            onClick={() => setMobileTab('analysis')}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Main 3-column row below navbar: Sidebar (var(--sidebar-w)) | Main (flex) | Right panel (var(--rightpanel-w)) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-y-auto lg:overflow-hidden lg:h-[calc(100dvh-var(--nav-h)-var(--status-h))] lg:max-h-[calc(100dvh-var(--nav-h)-var(--status-h))]">
        {/* Sidebar Drawer on mobile/tablet or column on desktop */}
        <aside
          className={clsx(
            'bg-white border-r border-line shrink-0 z-40',
            // Desktop >= 1024: static column
            'hidden lg:flex lg:flex-col lg:static h-full min-h-0',
            // Mobile/Tablet: Slide-out drawer
            sidebarOpen && '!flex fixed inset-y-0 left-0 w-[280px] max-w-[85vw] flex-col shadow-none z-50'
          )}
          style={!sidebarOpen ? { width: 'var(--sidebar-w)' } : undefined}
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

        {/* Main Workspace Column */}
        <div
          className={clsx(
            'flex-1 min-w-0 flex flex-col overflow-hidden bg-tint-bg h-full',
            'md:shrink-0 lg:shrink md:min-h-[420px] lg:min-h-0',
            mobileTab === 'analysis' && 'max-md:hidden'
          )}
          style={{ padding: '24px', gap: '16px' }}
        >
          {/* Title Row: Page title left, segmented control right. No description line. */}
          <div className="flex items-center justify-between shrink-0">
            <h1 className="text-page-title truncate">
              {pageTitle}
            </h1>

            {/* Segmented control: Graph | Simulator */}
            <SegmentedControl<LabMode>
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

          {/* Toolbar Row */}
          <PlaybackBar />

          {/* Content Area */}
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
              className="flex-1 min-h-0 overflow-y-auto"
              role="tabpanel"
              id="workspace-panel-simulate"
              aria-labelledby="workspace-tab-simulate"
              tabIndex={-1}
            >
              <SimulatorView hideHeader />
            </div>
          )}
        </div>

        {/* Right Panel: var(--rightpanel-w) on desktop, full-width below main on tablet */}
        <aside
          className={clsx(
            'bg-white z-20 shrink-0 flex flex-col h-full min-h-0',
            'border-t lg:border-t-0 lg:border-l border-line',
            'max-md:hidden',
            mobileTab === 'analysis' && '!flex flex-1 flex-col w-full',
            'md:w-full lg:w-[var(--rightpanel-w)] md:min-h-[340px] lg:min-h-0 lg:static'
          )}
          aria-label="Analysis panels"
        >
          <RightPanel />
        </aside>
      </div>

      {/* Notice / Error banner if any */}
      {(notice || error) && (
        <div
          className="flex flex-wrap items-center gap-8 px-24 py-8 border-t border-line font-mono text-[13px] bg-white"
          role={error ? 'alert' : 'status'}
        >
          <span
            className={clsx(
              'inline-flex items-center px-8 py-2 border font-medium',
              error
                ? 'border-danger/30 bg-danger-tint text-danger'
                : 'border-warning/30 bg-warning-tint text-warning'
            )}
          >
            <span aria-hidden="true" className="mr-4">
              {error ? '⚠' : 'ℹ'}
            </span>
            <span>{error ?? notice}</span>
          </span>
          <button
            type="button"
            className="font-mono text-[12px] text-muted hover:text-ink cursor-pointer px-4"
            onClick={clearMessage}
          >
            dismiss
          </button>
        </div>
      )}

      <PolicyToast />

      {/* Fixed 48px Status Bar at the bottom */}
      <StatusBanner />
    </div>
  );
}
