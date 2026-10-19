import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Learn } from '../../src/pages/Learn';
import { Landing } from '../../src/pages/Landing';
import { detectDeadlock } from '../../src/engine/detect';
import { PRESETS } from '../../src/scenarios/presets';
import { resetStore } from '../helpers/resetStore';

const renderLearn = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Learn />
    </MemoryRouter>
  );

const classicStatus = detectDeadlock(PRESETS['classic-deadlock']!.state).result.coffmanStatus;

describe('Learn page', () => {
  beforeEach(() => {
    cleanup();
    resetStore('classic-deadlock');
  });
  afterEach(() => cleanup());

  it('lets the student commit to an answer and compares it with the engine', () => {
    renderLearn();
    act(() => {
      screen.getByRole('tab', { name: 'Four Coffman conditions' }).click();
    });

    expect(screen.getByTestId('coffman-checklist')).toBeInTheDocument();
    expect(screen.getByTestId('coffman-score')).toHaveTextContent('No answers yet');

    // Agree with the engine about circular wait.
    act(() => {
      screen
        .getByTestId(classicStatus.circularWait ? 'guess-holds-circularWait' : 'guess-not-holds-circularWait')
        .click();
    });
    expect(screen.getByTestId('guess-result-circularWait')).toHaveTextContent('agreed with the engine');

    // Disagree about hold and wait.
    act(() => {
      screen
        .getByTestId(classicStatus.holdAndWait ? 'guess-not-holds-holdAndWait' : 'guess-holds-holdAndWait')
        .click();
    });
    expect(screen.getByTestId('guess-result-holdAndWait')).toHaveTextContent('The engine says');
    expect(screen.getByTestId('coffman-score')).toHaveTextContent('1 of 2');

    act(() => {
      screen.getByRole('button', { name: 'Reset answers' }).click();
    });
    expect(screen.getByTestId('coffman-score')).toHaveTextContent('No answers yet');
    expect(screen.getByTestId('guess-holds-circularWait')).toBeInTheDocument();
  });

  it('says which conditions hold right now for the current scenario', () => {
    renderLearn();
    act(() => {
      screen.getByRole('tab', { name: 'Four Coffman conditions' }).click();
    });
    const expected = classicStatus.circularWait ? 'engine: holds' : 'engine: does not hold';
    expect(screen.getByTestId('coffman-checklist')).toHaveTextContent(expected);
  });

  it('explains that an empty scenario cannot be assessed', () => {
    resetStore();
    renderLearn();
    act(() => {
      screen.getByRole('tab', { name: 'Four Coffman conditions' }).click();
    });
    expect(screen.getByTestId('coffman-unassessable')).toHaveTextContent(/no process or no resource/i);
  });

  it('wires each tab to the panel it controls and shows the complexity table', () => {
    renderLearn();
    const panel = document.getElementById('learn-panel')!;
    expect(panel).toHaveAttribute('role', 'tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', 'learn-tab-what-is-a-deadlock');

    act(() => {
      screen.getByRole('tab', { name: 'Complexity' }).click();
    });

    expect(panel).toHaveAttribute('aria-labelledby', 'learn-tab-complexity');
    expect(screen.getByRole('tab', { name: 'Complexity' })).toHaveAttribute('aria-selected', 'true');
    const table = screen.getByRole('table', { name: 'Algorithm complexity table' });
    expect(table).toHaveTextContent("Banker's safety");
    expect(table).toHaveTextContent('O(n² · m)');
  });
});

describe('Landing page', () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("derives the hero's chip text from the real engine result", () => {
    const expected = detectDeadlock(PRESETS['classic-deadlock']!.state).result.hasDeadlock
      ? 'Deadlock detected'
      : 'No deadlock';

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Landing />
      </MemoryRouter>
    );

    const chip = screen.getByTestId('hero-status-chip');
    expect(chip).toHaveTextContent(expected);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('See deadlocks happen');
  });

  it('renders the three How-it-works columns with exact copy', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Landing />
      </MemoryRouter>
    );

    const cols = screen.getByTestId('how-it-works-columns');
    expect(cols).toHaveTextContent('01');
    expect(cols).toHaveTextContent('Build a scenario');
    expect(cols).toHaveTextContent('02');
    expect(cols).toHaveTextContent('Run an algorithm');
    expect(cols).toHaveTextContent('03');
    expect(cols).toHaveTextContent('Watch and recover');
    expect(cols).toMatchSnapshot();
  });

  it('contains no footer and no CTA button', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Landing />
      </MemoryRouter>
    );

    expect(container.querySelector('footer')).toBeNull();
    // No CTA buttons on landing
    expect(screen.queryByRole('button', { name: /open|start|get started/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /open the lab|start with the classic/i })).toBeNull();
  });

  it('uses no accent-coloured text anywhere on the page', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Landing />
      </MemoryRouter>
    );
    expect(container.querySelector('.text-ember')).toBeNull();
  });
});
