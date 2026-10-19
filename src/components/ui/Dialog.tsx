import React, { useEffect } from 'react';
import clsx from 'clsx';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center md:p-24 bg-ink/30 backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative z-10 w-full max-w-[560px] bg-white border border-line p-24 shadow-none rounded-none',
          'max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:max-w-none max-md:border-b-0',
          className
        )}
      >
        <div className="flex items-center justify-between pb-16 mb-16 border-b border-line">
          <h2 id="dialog-title" className="font-poppins text-h3 font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[16px] text-muted hover:text-ink cursor-pointer p-4 rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
