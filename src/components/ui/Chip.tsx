import React from 'react';
import clsx from 'clsx';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  dotColor?: string;
  tone?: 'default' | 'danger' | 'success' | 'warning';
}

export function Chip({
  dotColor,
  tone = 'default',
  children,
  className,
  ...props
}: ChipProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center gap-6 h-[var(--chip-h)] px-10 border border-line bg-white font-mono text-[12px] text-ink whitespace-nowrap select-none rounded-none',
        tone === 'danger' && 'border-danger bg-danger-tint text-danger',
        tone === 'success' && 'border-success bg-success-tint text-success',
        tone === 'warning' && 'border-warning bg-warning-tint text-warning',
        className
      )}
      {...props}
    >
      {dotColor && (
        <span
          className="w-[6px] h-[6px] shrink-0"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}
