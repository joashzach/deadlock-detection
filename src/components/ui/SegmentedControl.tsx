import clsx from 'clsx';

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
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx('inline-flex h-[var(--ctrl-h)] border border-line bg-white rounded-none shrink-0', className)}
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
              'h-full px-24 font-poppins text-[14px] font-medium transition-colors cursor-pointer select-none whitespace-nowrap rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
              isActive
                ? 'bg-navy text-white font-semibold'
                : 'bg-white text-muted hover:text-ink'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
