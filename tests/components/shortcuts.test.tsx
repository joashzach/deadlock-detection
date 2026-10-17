import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../../src/components/Layout';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

/** Mounts the real application shell so the global shortcut hook is wired exactly as in the app. */
function renderShell(initialPath = '/lab') {
  return render(
    <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/lab" element={<div>lab page</div>} />
          <Route path="/learn" element={<div>learn page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const press = (key: string, options: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document.body, { key, ...options });

describe('Keyboard shortcuts', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    cleanup();
    resetStore('classic-deadlock');
  });

  it('plays, steps, and rewinds the active trace with Space, arrows, and R', () => {
    act(() => {
      useLabStore.getState().runDetection();
    });
    const total = useLabStore.getState().traceSteps.length;
    expect(total).toBeGreaterThan(1);

    renderShell();

    act(() => {
      press(' ');
    });
    expect(useLabStore.getState().isPlaying).toBe(true);

    act(() => {
      press('ArrowRight');
    });
    expect(useLabStore.getState().stepIndex).toBe(1);

    act(() => {
      press('ArrowLeft');
    });
    expect(useLabStore.getState().stepIndex).toBe(0);

    act(() => {
      useLabStore.getState().setStepIndex(total - 1);
    });
    act(() => {
      press('r');
    });
    expect(useLabStore.getState().stepIndex).toBe(0);
    expect(useLabStore.getState().isPlaying).toBe(false);
  });

  it('ignores shortcuts while a text field has focus', () => {
    act(() => {
      useLabStore.getState().runDetection();
    });
    renderShell();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      fireEvent.keyDown(input, { key: ' ' });
    });
    expect(useLabStore.getState().isPlaying).toBe(false);

    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowRight' });
    });
    expect(useLabStore.getState().stepIndex).toBe(0);

    input.remove();
  });

  it('leaves Space to whichever button has focus', () => {
    act(() => {
      useLabStore.getState().runDetection();
    });
    renderShell();

    act(() => {
      fireEvent.keyDown(screen.getByRole('link', { name: 'Lab' }), { key: ' ' });
    });
    expect(useLabStore.getState().isPlaying).toBe(false);
  });

  it('opens the shortcuts dialog with ? , goes quiet while it is open, and closes with Escape', () => {
    act(() => {
      useLabStore.getState().runDetection();
    });
    renderShell();

    act(() => {
      press('?');
    });
    expect(useLabStore.getState().shortcutsOpen).toBe(true);

    const dialog = screen.getByTestId('shortcuts-dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('Space');

    act(() => {
      press(' ');
    });
    expect(useLabStore.getState().isPlaying).toBe(false);

    act(() => {
      press('Escape');
    });
    expect(useLabStore.getState().shortcutsOpen).toBe(false);
    expect(screen.queryByTestId('shortcuts-dialog')).not.toBeInTheDocument();
  });

  it('also opens the dialog from the top bar button', () => {
    renderShell();
    act(() => {
      screen.getByRole('button', { name: 'Keyboard shortcuts' }).click();
    });
    expect(useLabStore.getState().shortcutsOpen).toBe(true);
    expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();
  });

  it('undoes and redoes scenario edits with Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y', () => {
    renderShell();
    const before = useLabStore.getState().scenario.processes.length;

    act(() => {
      useLabStore.getState().addProcess();
    });
    const added = useLabStore.getState().scenario.processes.length;
    expect(added).toBe(before + 1);

    act(() => {
      press('z', { ctrlKey: true });
    });
    expect(useLabStore.getState().scenario.processes.length).toBe(before);

    act(() => {
      press('z', { ctrlKey: true, shiftKey: true });
    });
    expect(useLabStore.getState().scenario.processes.length).toBe(added);

    act(() => {
      press('z', { ctrlKey: true });
    });
    expect(useLabStore.getState().scenario.processes.length).toBe(before);

    act(() => {
      press('y', { ctrlKey: true });
    });
    expect(useLabStore.getState().scenario.processes.length).toBe(added);
  });

  it('drives the live simulator with Space and restarts it with R', () => {
    resetStore('dining-philosophers');
    act(() => {
      useLabStore.getState().setLabMode('simulate');
      useLabStore.getState().initSimulator();
      useLabStore.getState().stepSimulatorCount(3);
    });
    expect(useLabStore.getState().simulator!.policied.tick).toBeGreaterThan(0);

    renderShell();

    act(() => {
      press(' ');
    });
    expect(useLabStore.getState().isPlaying).toBe(true);

    act(() => {
      press('r');
    });
    expect(useLabStore.getState().simulator!.policied.tick).toBe(0);
  });
});

describe('Top bar', () => {
  beforeEach(() => {
    resetStore('classic-deadlock');
  });
  afterEach(() => cleanup());

  it('marks the current page and offers undo/redo only in the Lab', () => {
    renderShell('/learn');

    expect(screen.getByRole('link', { name: 'Learn' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Lab' })).not.toHaveAttribute('aria-current');
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    cleanup();
    renderShell('/lab');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('keeps the brand monochrome (no accent used as text)', () => {
    renderShell();
    const brand = screen.getByRole('link', { name: 'DeadlockLab home' });
    expect(brand).toHaveTextContent('deadlocklab');
    expect(brand.querySelector('.text-ember')).toBeNull();
  });
});
