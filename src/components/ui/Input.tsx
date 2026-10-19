import React, { forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={clsx(
            'w-full h-[var(--ctrl-h)] px-[clamp(12px,1.1vw,16px)] bg-white font-mono text-[14px] text-ink border rounded-none transition-colors outline-none',
            error
              ? 'border-danger focus:border-danger focus:outline-2 focus:outline-danger focus:outline-offset-2'
              : 'border-line focus:border-navy focus:outline-2 focus:outline-navy focus:outline-offset-2',
            className
          )}
          {...props}
        />
        {error && <p className="mt-4 font-mono text-[12px] text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
