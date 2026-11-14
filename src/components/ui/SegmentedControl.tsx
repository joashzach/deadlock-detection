import clsx from 'clsx';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  testId?: string;
  id?: string;
  controls?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  const isSm = size === 'sm';
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        'relative inline-flex border border-line bg-white rounded-none shrink-0 select-none',
        isSm ? 'h-[34px]' : 'h-[40px]',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            id={option.id}
            aria-controls={option.controls}
            aria-selected={isActive}
            data-testid={option.testId}
            onClick={() => onChange(option.value)}
            className={clsx(
              'relative h-full font-poppins whitespace-nowrap cursor-pointer select-none rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2 transition-colors flex items-center justify-center',
              isSm ? 'px-8 text-[12px] font-medium' : 'px-16 text-button',
              isActive
                ? 'text-white font-medium'
                : 'text-muted hover:text-ink'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="segmented-indicator"
                className="absolute inset-0 bg-navy z-0"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
