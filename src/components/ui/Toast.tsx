import clsx from 'clsx';

export interface ToastProps {
  tone?: 'default' | 'danger' | 'success' | 'warning';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  tone = 'default',
  title,
  message,
  onDismiss,
  className,
}: ToastProps) {
  return (
    <div
      role="status"
      className={clsx(
        'bg-white border border-line p-16 flex items-start gap-12 font-mono text-[13px] shadow-none select-none border-l-4',
        tone === 'danger' && 'border-l-danger text-ink',
        tone === 'success' && 'border-l-success text-ink',
        tone === 'warning' && 'border-l-warning text-ink',
        tone === 'default' && 'border-l-navy text-ink',
        className
      )}
    >
      <div className="flex-1">
        {title && <p className="font-semibold mb-2">{title}</p>}
        <p className="text-muted">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="font-mono text-muted hover:text-ink transition-colors cursor-pointer p-2"
          aria-label="Dismiss message"
        >
          ✕
        </button>
      )}
    </div>
  );
}
