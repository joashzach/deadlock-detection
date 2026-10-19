import React, { forwardRef } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'compact' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'default', className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-poppins text-button font-medium whitespace-nowrap transition-colors select-none rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
          size === 'default' && 'h-[var(--ctrl-h)] px-[clamp(12px,1.1vw,16px)]',
          size === 'compact' && 'h-[var(--ctrl-h)] px-12',
          size === 'icon' && 'h-[var(--ctrl-h)] w-[var(--ctrl-h)] p-0 shrink-0',
          variant === 'primary' &&
            'bg-navy text-white border border-navy hover:bg-navy-hover hover:border-navy-hover active:bg-navy-hover',
          variant === 'secondary' &&
            'bg-white text-ink border border-line hover:bg-tint-bg hover:border-line active:bg-tint-bg',
          variant === 'ghost' &&
            'bg-transparent text-muted border border-transparent hover:text-ink hover:bg-tint-bg',
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
