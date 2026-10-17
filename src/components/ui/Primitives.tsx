import { ReactNode } from 'react';
import clsx from 'clsx';

export function Panel({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'aside';
}) {
  return <Tag className={clsx('panel', className)}>{children}</Tag>;
}

export function Chip({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'inverse' | 'ember' | 'amber';
  className?: string;
  title?: string;
}) {
  const toneClass =
    tone === 'inverse'
      ? 'chip-inverse'
      : tone === 'ember'
        ? 'chip-ember'
        : tone === 'amber'
          ? 'chip-amber'
          : '';
  return (
    <span className={clsx('chip', toneClass, className)} title={title}>
      {children}
    </span>
  );
}

/**
 * A small status marker that always pairs a colour with a glyph and a text label,
 * so meaning never depends on colour alone (PRD 5.3).
 */
export function StateMarker({
  tone,
  glyph,
  label,
  pulse = false,
}: {
  tone: 'neutral' | 'active' | 'success' | 'warning' | 'danger';
  glyph: string;
  label: string;
  pulse?: boolean;
}) {
  const toneClass: Record<string, string> = {
    neutral: 'chip',
    active: 'chip chip-inverse',
    success: 'chip chip-inverse',
    warning: 'chip chip-amber',
    danger: 'chip chip-ember',
  };
  return (
    <span
      className={clsx(toneClass[tone], pulse && 'deadlock-pulse')}
      role="status"
      aria-label={label}
    >
      <span aria-hidden="true">{glyph}</span>
      <span>{label}</span>
    </span>
  );
}
