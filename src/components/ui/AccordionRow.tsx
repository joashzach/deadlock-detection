import React from 'react';
import clsx from 'clsx';

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
    <div className={clsx('border-t border-line bg-white', className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        data-testid={testId}
        className="w-full h-[44px] flex items-center justify-between text-left font-mono text-[14px] text-ink hover:text-navy transition-colors cursor-pointer select-none px-0 rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy shrink-0"
      >
        <span className="font-medium text-ink">{label}</span>
        <div className="flex items-center gap-[8px]">
          {count !== undefined && (
            <span className="font-mono text-[13px] text-muted">
              {count}
            </span>
          )}
          {/* Rotating Chevron */}
          <svg
            className={clsx(
              'w-[14px] h-[14px] text-muted transition-transform duration-200 motion-reduce:transition-none shrink-0',
              isOpen && 'rotate-90'
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* Expand/Collapse with grid-template-rows 0fr -> 1fr */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="p-[12px] pt-0 space-y-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
