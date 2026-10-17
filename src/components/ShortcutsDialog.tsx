import { useEffect, useRef } from 'react';
import { useLabStore } from '../store/useLabStore';

const GROUPS: Array<{ title: string; items: Array<{ keys: string[]; description: string }> }> = [
  {
    title: 'Playback',
    items: [
      { keys: ['Space'], description: 'Play or pause the current trace or simulation' },
      { keys: ['→'], description: 'Step forward one step' },
      { keys: ['←'], description: 'Step back one step' },
      { keys: ['R'], description: 'Reset the current run (rewind the trace, restart the simulator)' },
    ],
  },
  {
    title: 'Editing',
    items: [
      { keys: ['Ctrl', 'Z'], description: 'Undo the last scenario change' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
    ],
  },
  {
    title: 'Help',
    items: [
      { keys: ['?'], description: 'Open or close this dialog' },
      { keys: ['Esc'], description: 'Close this dialog' },
    ],
  },
];

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard-shortcut reference (PRD §5.5). Opens with `?`, closes with `Esc`, the
 * backdrop, or its own button; focus moves into the dialog and is restored on close,
 * and Tab is kept inside while it is open.
 */
export function ShortcutsDialog() {
  const open = useLabStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useLabStore((s) => s.setShortcutsOpen);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShortcutsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [open, setShortcutsOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-16"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setShortcutsOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        tabIndex={-1}
        className="panel w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-24 bg-off-white"
        data-testid="shortcuts-dialog"
      >
        <div className="flex items-start justify-between gap-16 mb-16">
          <h2 id="shortcuts-title" className="section-heading text-subheading">
            Keyboard shortcuts
          </h2>
          <button type="button" className="btn btn-ghost" onClick={() => setShortcutsOpen(false)}>
            Close
          </button>
        </div>

        <div className="space-y-24">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="font-semibold text-ink-black mb-8">{group.title}</h3>
              <table className="w-full border-collapse font-mono text-body-sm">
                <caption className="sr-only">{group.title} shortcuts</caption>
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.description} className="border-t border-fog">
                      <th scope="row" className="text-left font-normal py-8 pr-16 align-top w-[180px]">
                        <span className="inline-flex flex-wrap items-center gap-4">
                          {item.keys.map((key) => (
                            <kbd key={key} className="chip">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      </th>
                      <td className="py-8 text-graphite">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        <p className="text-body-sm text-graphite mt-16">
          Shortcuts are ignored while you are typing in a field, and Space is left to whichever button has focus.
        </p>
      </div>
    </div>
  );
}
