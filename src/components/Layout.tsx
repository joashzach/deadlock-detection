import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <TopBar />
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <footer className="border-t border-fog px-16 py-16 text-body-sm text-graphite">
        <div className="max-w-page mx-auto flex flex-wrap items-center gap-16 justify-between">
          <span>DeadlockLab — an interactive deadlock simulator for operating-systems students.</span>
          <span>Built with React, TypeScript, and custom SVG. No backend, no tracking.</span>
        </div>
      </footer>
    </div>
  );
}
