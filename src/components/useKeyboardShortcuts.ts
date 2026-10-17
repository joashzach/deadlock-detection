import { useEffect } from 'react';
import { useLabStore } from '../store/useLabStore';

/** Text entry: never hijack keys here, so typing and native undo keep working. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}

/** Controls that activate on Space themselves — leave the key to them. */
function isSpaceActivated(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === 'BUTTON' || target.tagName === 'A') return true;
  const role = target.getAttribute('role');
  return role === 'tab' || role === 'radio' || role === 'checkbox' || role === 'option';
}

/**
 * Application-wide keyboard shortcuts (PRD §5.5):
 *   Space  play / pause the active trace (or the simulator)
 *   → / ←  step forward / back
 *   R      reset the current run
 *   ?      open the shortcuts dialog       Esc  close it
 *   Ctrl/⌘+Z undo · Ctrl/⌘+Shift+Z (or Ctrl+Y) redo
 * Shortcuts never fire while typing in a field, and Space is left to focused buttons.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (isTextEntry(target)) return;

      const state = useLabStore.getState();

      if (event.key === 'Escape') {
        if (state.shortcutsOpen) {
          event.preventDefault();
          state.setShortcutsOpen(false);
        }
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      if (modifier) {
        const key = event.key.toLowerCase();
        if (key === 'z') {
          event.preventDefault();
          if (event.shiftKey) state.redo();
          else state.undo();
          return;
        }
        if (key === 'y') {
          event.preventDefault();
          state.redo();
        }
        return;
      }

      if (event.altKey) return;

      if (event.key === '?') {
        event.preventDefault();
        state.toggleShortcuts();
        return;
      }

      // The dialog owns the keyboard while it is open.
      if (state.shortcutsOpen) return;

      const hasTrace = state.traceSteps.length > 0;

      if (event.key === ' ' || event.key === 'Spacebar') {
        if (isSpaceActivated(target)) return;
        if (state.labMode === 'simulate' ? state.simulator !== null : hasTrace) {
          event.preventDefault();
          state.togglePlaying();
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        if (!hasTrace) return;
        event.preventDefault();
        state.nextStep();
        return;
      }

      if (event.key === 'ArrowLeft') {
        if (!hasTrace) return;
        event.preventDefault();
        state.prevStep();
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        if (event.shiftKey) return;
        if (state.labMode === 'simulate') {
          if (!state.simulator) return;
          event.preventDefault();
          state.resetSimulator();
          return;
        }
        if (!hasTrace) return;
        event.preventDefault();
        state.setPlaying(false);
        state.setStepIndex(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
