import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

export function Layout() {
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-8 focus:left-8 focus:z-50 focus:rounded-full focus:bg-obsidian focus:px-16 focus:py-8 focus:text-off-white focus:no-underline"
      >
        Skip to main content
      </a>

      <TopBar />

      <main id="main-content" className="flex-1 min-h-0">
        <Outlet />
      </main>

      <footer className="border-t border-fog px-16 py-16 text-body-sm text-graphite">
        <div className="max-w-page mx-auto flex flex-wrap items-center gap-16 justify-between">
          <span>DeadlockLab — an interactive deadlock simulator for operating-systems students.</span>
          <span>Built with React, TypeScript, and custom SVG. No backend, no tracking.</span>
        </div>
      </footer>

      <ShortcutsDialog />
    </div>
  );
}
