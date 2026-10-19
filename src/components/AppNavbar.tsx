import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const NAV = [
  { to: '/lab', label: 'Lab' },
  { to: '/learn', label: 'Learn' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/about', label: 'About' },
];

export function AppNavbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-line shrink-0 h-[var(--nav-h)] select-none">
      <div className="h-full w-full flex items-center justify-between px-[16px] md:px-[32px]">
        {/* Brand Logo: Poppins 22/600 navy at left */}
        <Link
          to="/"
          className="font-poppins text-[22px] font-semibold text-navy no-underline tracking-tight select-none"
          aria-label="DeadLockLab home"
        >
          DeadLockLab
        </Link>

        {/* Desktop Navigation: Lab, Learn, Quiz, About at right with Poppins 16/500, gap 36px */}
        <nav
          className="hidden md:flex items-center h-full gap-[36px]"
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const current = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={current ? 'page' : undefined}
                className={clsx(
                  'font-poppins text-[16px] font-medium no-underline h-full flex items-center transition-colors whitespace-nowrap border-b-2 -mb-[1px]',
                  current
                    ? 'text-ink border-navy'
                    : 'text-muted border-transparent hover:text-ink'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button (<768px) */}
        <button
          type="button"
          className="md:hidden font-poppins text-[16px] font-medium text-ink p-8 select-none rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Mobile nav dropdown (<768px, 48px rows) */}
      {menuOpen && (
        <nav
          className="md:hidden bg-white border-b border-line px-[16px] py-8 shadow-none"
          aria-label="Mobile Primary"
        >
          {NAV.map((item) => {
            const current = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={current ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'h-[48px] flex items-center font-poppins text-[16px] no-underline border-b border-line last:border-b-0 transition-colors',
                  current
                    ? 'text-navy font-semibold border-l-2 border-l-navy pl-8'
                    : 'text-muted hover:text-ink pl-8'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
