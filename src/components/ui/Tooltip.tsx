import React, { useState } from 'react';
import clsx from 'clsx';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 px-8 py-4 bg-ink text-white font-mono text-[12px] whitespace-nowrap z-50 pointer-events-none rounded-none shadow-none"
        >
          {content}
        </div>
      )}
    </div>
  );
}
