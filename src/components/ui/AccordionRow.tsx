import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface AccordionRowProps {
  label: string;
  count?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

export function AccordionRow({
  label,
  count,
  isOpen,
  onToggle,
  children,
  className,
  testId,
}: AccordionRowProps) {
  return (
    <div className={clsx('border-t border-line bg-white w-full select-none', className)}>
      {/* Header Button: 38px high, full width, mono 13, rotating 15px chevron */}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        data-testid={testId}
        className="w-full h-[38px] flex items-center justify-between text-left font-mono text-[13px] text-ink hover:text-navy transition-colors cursor-pointer select-none px-0 rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy shrink-0"
      >
        <span className="font-medium text-ink">{label}</span>
        <div className="flex items-center gap-8">
          {count !== undefined && (
            <span className="font-mono text-[12px] text-muted">
              {count}
            </span>
          )}
          <ChevronDown
            size={15}
            strokeWidth={1.5}
            className={clsx(
              'text-muted transition-transform duration-200 motion-reduce:transition-none shrink-0',
              isOpen && 'rotate-180 text-navy'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Content panel: grid-template-rows 0fr -> 1fr, 200ms ease-out, opacity 0 -> 1 */}
      <div
        className={clsx(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'opacity-100 overflow-visible' : 'opacity-0 pointer-events-none overflow-hidden'
        )}
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className={clsx('min-h-0 w-full', isOpen ? 'overflow-visible' : 'overflow-hidden')}>
          <div
            className="w-full"
            style={{ padding: '12px 0 16px' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
