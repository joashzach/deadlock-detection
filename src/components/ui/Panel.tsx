import React from 'react';
import clsx from 'clsx';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'aside';
}

export function Panel({
  as: Component = 'div',
  children,
  className,
  ...props
}: PanelProps) {
  return (
    <Component
      className={clsx(
        'bg-white border border-line p-24 rounded-none shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
