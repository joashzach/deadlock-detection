import { Outlet, useLocation } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useLabStore } from '../store/useLabStore';

export function Layout() {
  useKeyboardShortcuts();
  const location = useLocation();
  const isFixedLayout = location.pathname.startsWith('/lab') || location.pathname.startsWith('/learn');
  const shortcutsOpen = useLabStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useLabStore((s) => s.setShortcutsOpen);

  return (
    <div
      className={
        isFixedLayout
          ? 'h-[100dvh] max-h-[100dvh] flex flex-col bg-white overflow-hidden'
          : 'min-h-[100dvh] flex flex-col bg-white overflow-x-hidden'
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-8 focus:left-8 focus:z-50 focus:bg-navy focus:text-white focus:px-16 focus:py-8 focus:font-mono focus:text-[14px] focus:outline-2 focus:outline-navy"
      >
        Skip to main content
      </a>

      <AppNavbar />

      <main
        id="main-content"
        className={isFixedLayout ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : 'flex-1 flex flex-col'}
      >
        <Outlet />
      </main>

      <ShortcutsDialog />

      {/* Screen-reader keyboard shortcuts button */}
      <button
        type="button"
        className="sr-only"
        style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute', opacity: 0 }}
        onClick={() => setShortcutsOpen(!shortcutsOpen)}
        aria-haspopup="dialog"
        aria-expanded={shortcutsOpen}
        aria-label="Keyboard shortcuts"
      >
        Keyboard shortcuts
      </button>
    </div>
  );
}
