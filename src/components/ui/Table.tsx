import React from 'react';
import clsx from 'clsx';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto border border-line">
      <table
        className={clsx('w-full border-collapse font-mono text-[14px] text-left', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={clsx('border-b border-line bg-tint-bg text-muted font-medium', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={clsx('divide-y divide-line bg-white text-ink', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx('transition-colors hover:bg-tint-bg/50', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={clsx('p-12 font-medium', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('p-12', className)} {...props}>
      {children}
    </td>
  );
}
