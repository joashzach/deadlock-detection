import React from 'react';
import clsx from 'clsx';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'danger' | 'success' | 'warning';
}

export function Tag({
  tone = 'default',
  children,
  className,
  ...props
}: TagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono text-[12px] font-medium leading-none px-8 py-4 border rounded-none whitespace-nowrap select-none',
        tone === 'default' && 'border-line bg-tint-bg text-muted',
        tone === 'danger' && 'border-danger/30 bg-danger-tint text-danger',
        tone === 'success' && 'border-success/30 bg-success-tint text-success',
        tone === 'warning' && 'border-warning/30 bg-warning-tint text-warning',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
