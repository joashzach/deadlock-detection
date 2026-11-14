import React, { forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  sizeVariant?: 'md' | 'sm';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, sizeVariant = 'md', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={clsx(
            'w-full bg-white font-mono text-ink border rounded-none transition-colors outline-none',
            sizeVariant === 'md' && 'h-[40px] px-16 text-[14px]',
            sizeVariant === 'sm' && 'h-[32px] px-12 text-[12px]',
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
