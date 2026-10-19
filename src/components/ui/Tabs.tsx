import clsx from 'clsx';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  testId?: string;
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        'flex items-center gap-16 border-b border-line bg-white h-[44px] shrink-0 overflow-x-auto overflow-y-hidden select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={isActive}
            data-testid={tab.testId}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'h-full font-poppins text-tab font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center border-b-2 rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
              isActive
                ? 'text-ink font-semibold border-navy'
                : 'text-muted border-transparent hover:text-ink'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
