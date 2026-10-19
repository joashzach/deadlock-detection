import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function UndoIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <path d="M 6 4 L 3 7 L 6 10" />
      <path d="M 3 7 H 10 A 3 3 0 0 1 13 10 A 3 3 0 0 1 10 13 H 5" />
    </svg>
  );
}

export function RedoIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <path d="M 10 4 L 13 7 L 10 10" />
      <path d="M 13 7 H 6 A 3 3 0 0 0 3 10 A 3 3 0 0 0 6 13 H 11" />
    </svg>
  );
}

export function StepFirstIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <line x1="3" y1="4" x2="3" y2="12" />
      <polygon points="12,4 6,8 12,12" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StepPrevIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <polygon points="11,4 5,8 11,12" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlayIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      {...props}
    >
      <polygon points="5,3 13,8 5,13" />
    </svg>
  );
}

export function PauseIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="3" width="3" height="10" />
      <rect x="9" y="3" width="3" height="10" />
    </svg>
  );
}

export function StepNextIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <polygon points="5,4 11,8 5,12" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StepLastIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      <polygon points="4,4 10,8 4,12" fill="currentColor" stroke="none" />
      <line x1="13" y1="4" x2="13" y2="12" />
    </svg>
  );
}
