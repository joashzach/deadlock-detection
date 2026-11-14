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

describe('Learn page', () => {
  beforeEach(() => {
    cleanup();
    resetStore('classic-deadlock');
  });
  afterEach(() => cleanup());

  it('renders all four Coffman conditions when the topic is selected', () => {
    renderLearn();
    act(() => {
      screen.getByRole('tab', { name: /Four Coffman conditions/i }).click();
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Mutual exclusion' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Hold and wait' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'No preemption' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Circular wait' })).toBeInTheDocument();
  });

  it('renders RAG vs WFG diagrams with both graph representations', () => {
    renderLearn();
    act(() => {
      screen.getByRole('tab', { name: /RAG vs WFG/i }).click();
    });

    expect(screen.getByText(/1\. Resource Allocation Graph \(RAG\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Wait-For Graph \(WFG\)/i)).toBeInTheDocument();
  });

  it('wires each tab to the panel it controls and shows the complexity table', () => {
    renderLearn();
    const panel = document.getElementById('learn-panel')!;
    expect(panel).toHaveAttribute('role', 'tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', 'learn-tab-what-is-a-deadlock');

    act(() => {
      screen.getByRole('tab', { name: /Complexity/i }).click();
    });

    expect(panel).toHaveAttribute('aria-labelledby', 'learn-tab-complexity');
    expect(screen.getByRole('tab', { name: /Complexity/i })).toHaveAttribute('aria-selected', 'true');
    const table = screen.getByRole('table', { name: 'Algorithm complexity table' });
    expect(table).toHaveTextContent("Banker's safety");
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
    resetStore('classic-deadlock');
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
    // Landing contains no buttons at all — pure navigation via nav links.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses no accent-coloured text anywhere on the page', () => {
    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Landing />
      </MemoryRouter>
    );

    // Verify all heading/p tags use ink or muted, never ember or accent.
    const headings = container.querySelectorAll('h1, h2, h3, p');
    headings.forEach((el) => {
      const cls = el.className;
      expect(cls).not.toMatch(/text-ember/);
      expect(cls).not.toMatch(/text-amber/);
    });
  });
});
