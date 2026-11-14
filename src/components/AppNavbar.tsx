import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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
    <header className="w-full bg-white border-b border-line shrink-0 h-[var(--nav-h)] select-none z-50">
      <div className="h-full w-full flex items-center justify-between px-16 md:px-32">
        {/* Brand Logo: Poppins 22/1/600 navy #0F2557 at left */}
        <Link
          to="/"
          className="font-poppins text-logo text-navy no-underline tracking-tight select-none"
          aria-label="DeadLockLab home"
        >
          DeadLockLab
        </Link>

        {/* Desktop Navigation: Lab, Learn, Quiz, About at right (Poppins 16/1/500, 36px gaps with sliding indicator) */}
        <nav
          className="hidden md:flex items-center h-full gap-36"
          style={{ gap: '36px' }}
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
                  'relative font-poppins text-nav no-underline h-full flex items-center whitespace-nowrap transition-colors select-none',
                  current
                    ? 'text-ink font-medium'
                    : 'text-muted hover:text-ink'
                )}
              >
                {item.label}
                {current && (
                  <motion.span
                    layoutId="navbar-tab-indicator"
                    className="absolute bottom-0 inset-x-0 h-[2px] bg-navy"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button (<768px) */}
        <button
          type="button"
          className="md:hidden font-poppins text-nav text-ink p-8 select-none rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy cursor-pointer"
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
          className="md:hidden bg-white border-b border-line px-16 py-8 shadow-none"
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
                  'h-[48px] flex items-center font-poppins text-nav no-underline border-b border-line last:border-b-0 transition-colors',
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
