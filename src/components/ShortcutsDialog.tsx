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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-16"
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
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-24 bg-white border border-line rounded-none shadow-none max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:max-w-none max-md:border-b-0 outline-none"
        data-testid="shortcuts-dialog"
      >
        <div className="flex items-center justify-between pb-16 mb-16 border-b border-line">
          <h2 id="shortcuts-title" className="font-poppins text-h3 font-semibold text-ink">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            className="font-mono text-[14px] text-muted hover:text-ink cursor-pointer p-4 rounded-none outline-none focus-visible:outline-2 focus-visible:outline-navy"
            onClick={() => setShortcutsOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-24">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="font-poppins text-panel font-semibold text-ink mb-8">{group.title}</h3>
              <table className="w-full border-collapse font-mono text-[13px]">
                <caption className="sr-only">{group.title} shortcuts</caption>
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.description} className="border-t border-line">
                      <th scope="row" className="text-left font-normal py-8 pr-16 align-top w-[180px]">
                        <span className="inline-flex flex-wrap items-center gap-4">
                          {item.keys.map((key) => (
                            <kbd key={key} className="inline-flex items-center px-6 py-2 border border-line bg-tint-bg font-mono text-[12px] text-ink rounded-none">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      </th>
                      <td className="py-8 text-muted">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        <p className="font-mono text-[12px] text-muted mt-24">
          Shortcuts are ignored while you are typing in a field, and Space is left to whichever button has focus.
        </p>
      </div>
    </div>
  );
}
