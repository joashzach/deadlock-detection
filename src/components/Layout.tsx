import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useLabStore } from '../store/useLabStore';

export function Layout() {
  useKeyboardShortcuts();
  const shortcutsOpen = useLabStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useLabStore((s) => s.setShortcutsOpen);

  return (
    <div
      className="grid h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-tint-bg"
      style={{ gridTemplateRows: 'var(--nav-h) 1fr' }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-8 focus:left-8 focus:z-50 focus:bg-navy focus:text-white focus:px-16 focus:py-8 focus:font-mono focus:text-[14px] focus:outline-2 focus:outline-navy"
      >
        Skip to main content
      </a>

      {/* Row 1: Navbar rendered outside the outlet so it never remounts or reflows */}
      <AppNavbar />

      {/* Row 2: Outlet area */}
      <main
        id="main-content"
        className="w-full h-full min-h-0 min-w-0 overflow-hidden relative flex flex-col"
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
