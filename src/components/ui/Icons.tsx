import {
  Undo2,
  Redo2,
  Play as LucidePlay,
  Pause as LucidePause,
  SkipBack,
  StepBack,
  StepForward,
  SkipForward,
  ChevronDown as LucideChevronDown,
  X as LucideX,
  Plus as LucidePlus,
  Minus as LucideMinus,
  Check as LucideCheck,
  LucideProps,
} from 'lucide-react';

export interface IconProps extends LucideProps {
  size?: number;
}

export function UndoIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <Undo2 size={size} strokeWidth={strokeWidth} {...props} />;
}

export function RedoIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <Redo2 size={size} strokeWidth={strokeWidth} {...props} />;
}

export function StepFirstIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <SkipBack size={size} strokeWidth={strokeWidth} {...props} />;
}

export function StepPrevIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <StepBack size={size} strokeWidth={strokeWidth} {...props} />;
}

export function PlayIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucidePlay size={size} strokeWidth={strokeWidth} fill="currentColor" {...props} />;
}

export function PauseIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucidePause size={size} strokeWidth={strokeWidth} fill="currentColor" {...props} />;
}

export function StepNextIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <StepForward size={size} strokeWidth={strokeWidth} {...props} />;
}

export function StepLastIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <SkipForward size={size} strokeWidth={strokeWidth} {...props} />;
}

export function ChevronDownIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucideChevronDown size={size} strokeWidth={strokeWidth} {...props} />;
}

export function CloseIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucideX size={size} strokeWidth={strokeWidth} {...props} />;
}

export function PlusIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucidePlus size={size} strokeWidth={strokeWidth} {...props} />;
}

export function MinusIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucideMinus size={size} strokeWidth={strokeWidth} {...props} />;
}

export function CheckIcon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return <LucideCheck size={size} strokeWidth={strokeWidth} {...props} />;
}
