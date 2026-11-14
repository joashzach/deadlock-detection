import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import clsx from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  sizeVariant?: 'md' | 'sm';
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  menuAlign?: 'left' | 'right';
}

export function Select({
  id: propId,
  name,
  value,
  onChange,
  options,
  sizeVariant = 'md',
  ariaLabel,
  placeholder = 'Select…',
  disabled = false,
  className,
  error,
  menuAlign = 'left',
}: SelectProps) {
  const generatedId = useId();
  const selectId = propId || generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const typeaheadTimeoutRef = useRef<number | null>(null);
  const typeaheadStringRef = useRef<string>('');

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Sync highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Scroll highlighted item into view if listbox is scrollable
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const listbox = listboxRef.current;
      if (listbox.scrollHeight > listbox.clientHeight) {
        const item = listbox.children[highlightedIndex] as HTMLElement | undefined;
        if (item) {
          item.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [isOpen, highlightedIndex]);

  const selectOption = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      setHighlightedIndex(options.length - 1);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        selectOption(options[highlightedIndex]!.value);
      }
      return;
    }

    // Type-ahead
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (typeaheadTimeoutRef.current) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }
      typeaheadStringRef.current += e.key.toLowerCase();
      typeaheadTimeoutRef.current = window.setTimeout(() => {
        typeaheadStringRef.current = '';
      }, 500);

      const matchIdx = options.findIndex((opt) =>
        opt.label.toLowerCase().startsWith(typeaheadStringRef.current)
      );
      if (matchIdx >= 0) {
        setHighlightedIndex(matchIdx);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx('relative w-full select-none', isOpen && 'z-50', className)}
    >
      {/* Hidden native select for HTML forms and test automation compatibility */}
      <select
        id={selectId}
        name={name}
        aria-label={ariaLabel}
        className="sr-only"
        tabIndex={-1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Styled Listbox Trigger */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        id={`${selectId}-trigger`}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'w-full bg-white font-mono text-left text-ink border flex items-center justify-between transition-colors cursor-pointer rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2',
          sizeVariant === 'md' ? 'h-[40px] px-12 text-[12px]' : 'h-[32px] px-8 text-[12px]',
          isOpen ? 'border-navy' : 'border-line hover:border-muted',
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          error && 'border-danger focus-visible:outline-danger'
        )}
      >
        <span
          className={clsx(
            'truncate pr-2 font-medium',
            !selectedOption || selectedOption.value === '' ? 'text-muted' : 'text-ink'
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          size={sizeVariant === 'md' ? 16 : 14}
          strokeWidth={1.5}
          className={clsx(
            'text-muted shrink-0 transition-transform duration-120 motion-reduce:transition-none',
            isOpen && 'rotate-180 text-navy'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Styled Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          className={clsx(
            'absolute top-full mt-[2px] bg-white border border-line z-50 list-none m-0 p-0 shadow-lg max-h-[220px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-120 motion-reduce:animate-none',
            menuAlign === 'right'
              ? 'right-0 min-w-full w-max max-w-[280px]'
              : 'left-0 min-w-full w-max max-w-[280px]'
          )}
          onKeyDown={handleKeyDown}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={opt.value}
                id={`${selectId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                title={opt.label}
                onClick={() => selectOption(opt.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={clsx(
                  'px-8 flex items-center justify-between font-mono cursor-pointer transition-colors whitespace-nowrap',
                  sizeVariant === 'md' ? 'h-[34px] text-[12px]' : 'h-[30px] text-[12px]',
                  isHighlighted ? 'bg-tint-bg' : 'bg-white',
                  isSelected ? 'text-navy font-semibold' : 'text-ink font-normal'
                )}
              >
                <span className="truncate pr-4">{opt.label}</span>
                {isSelected && (
                  <Check
                    size={14}
                    strokeWidth={2}
                    className="text-navy shrink-0 ml-2"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-4 font-mono text-[12px] text-danger">{error}</p>}
    </div>
  );
}
