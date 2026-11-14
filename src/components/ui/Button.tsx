import React, { forwardRef } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm' | 'icon' | 'icon-sm' | 'default' | 'compact';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, disabled, ...props }, ref) => {
    const isSm = size === 'sm' || size === 'compact';
    const isIconSm = size === 'icon-sm';
    const isIconMd = size === 'icon';

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-poppins text-[14px] leading-none font-medium whitespace-nowrap transition-colors select-none rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
          // Sizing: md = 40px (padding 16px), sm = 32px (padding 12px)
          (!isSm && !isIconSm && !isIconMd) && 'h-[40px] px-16',
          isSm && 'h-[32px] px-12',
          isIconMd && 'h-[40px] w-[40px] p-0 shrink-0',
          isIconSm && 'h-[32px] w-[32px] p-0 shrink-0',
          // Variants
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
