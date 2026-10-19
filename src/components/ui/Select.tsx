import React, { forwardRef } from 'react';
import clsx from 'clsx';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={clsx(
            'w-full h-[var(--ctrl-h)] px-[clamp(12px,1.1vw,16px)] text-left bg-white font-mono text-[14px] text-ink border rounded-none transition-colors outline-none cursor-pointer',
            error
              ? 'border-danger focus:border-danger focus:outline-2 focus:outline-danger focus:outline-offset-2'
              : 'border-line focus:border-navy focus:outline-2 focus:outline-navy focus:outline-offset-2',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-4 font-mono text-[12px] text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
