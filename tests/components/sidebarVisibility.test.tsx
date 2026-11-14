import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { Sidebar } from '../../src/components/Sidebar';
import { useLabStore } from '../../src/store/useLabStore';
import { resetStore } from '../helpers/resetStore';

describe('Sidebar Visibility & Layout Unification', () => {
  beforeEach(() => {
    resetStore();
    cleanup();
  });

  it('renders all section headers with unified styling', () => {
    render(<Sidebar />);

    expect(screen.getByText('SCENARIO')).toBeInTheDocument();
    expect(screen.getByText('ALGORITHM')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Processes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resources/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scripts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Policies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Advanced/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Import a scenario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export this scenario/i })).toBeInTheDocument();
  });

  it('Scripts dropdowns are fully visible and options can be selected', () => {
    // Add processes and resources first
    act(() => {
      const store = useLabStore.getState();
      store.addProcess(); // P0
      store.addProcess(); // P1
      store.addResource(); // R0
    });

    render(<Sidebar />);

    // Open Scripts accordion
    const scriptsButton = screen.getByRole('button', { name: /Scripts/i });
    fireEvent.click(scriptsButton);

    expect(screen.getByText('Request edge (P → R)')).toBeInTheDocument();
    expect(screen.getByText('Assignment edge (R → P)')).toBeInTheDocument();

    // The combobox triggers exist
    const reqProcessTrigger = screen.getByLabelText('Requesting process').nextElementSibling as HTMLButtonElement;
    const reqResourceTrigger = screen.getByLabelText('Requested resource').nextElementSibling as HTMLButtonElement;
    expect(reqProcessTrigger).toBeInTheDocument();
    expect(reqResourceTrigger).toBeInTheDocument();

    // Initially "Add request" is disabled because nothing is selected
    const addRequestBtn = screen.getByRole('button', { name: 'Add request' });
    expect(addRequestBtn).toBeDisabled();

    // Click process trigger to open dropdown
    fireEvent.click(reqProcessTrigger);
    expect(reqProcessTrigger).toHaveAttribute('aria-expanded', 'true');

    // Verify option P0 is present in the listbox and click it
    const listbox = screen.getByRole('listbox', { name: 'Requesting process' });
    const p0Option = listbox.querySelector('li[title="P0"]');
    expect(p0Option).toBeInTheDocument();
    fireEvent.click(p0Option!);

    // Click resource trigger to open dropdown
    fireEvent.click(reqResourceTrigger);
    const resListbox = screen.getByRole('listbox', { name: 'Requested resource' });
    const r0Option = resListbox.querySelector('li[title="R0"]');
    expect(r0Option).toBeInTheDocument();
    fireEvent.click(r0Option!);

    // Now Add request should be enabled
    expect(addRequestBtn).not.toBeDisabled();

    // Click Add request
    fireEvent.click(addRequestBtn);

    // Edge should be added
    const state = useLabStore.getState();
    expect(state.scenario.edges).toHaveLength(1);
    expect(state.scenario.edges[0]!.from).toBe('P0');
    expect(state.scenario.edges[0]!.to).toBe('R0');
    expect(state.scenario.edges[0]!.type).toBe('request');

    // Edge should be listed in the EDGES list
    expect(screen.getByText(/P0 → R0/i)).toBeInTheDocument();
  });

  it('Assignment edge dropdowns work and allow creating assignment edges', () => {
    act(() => {
      const store = useLabStore.getState();
      store.addProcess(); // P0
      store.addResource(); // R0
    });

    render(<Sidebar />);

    // Open Scripts accordion
    fireEvent.click(screen.getByRole('button', { name: /Scripts/i }));

    const asgResourceTrigger = screen.getByLabelText('Assigned resource').nextElementSibling as HTMLButtonElement;
    const asgProcessTrigger = screen.getByLabelText('Receiving process').nextElementSibling as HTMLButtonElement;

    fireEvent.click(asgResourceTrigger);
    const resListbox = screen.getByRole('listbox', { name: 'Assigned resource' });
    const r0Option = resListbox.querySelector('li[title="R0"]');
    fireEvent.click(r0Option!);

    fireEvent.click(asgProcessTrigger);
    const procListbox = screen.getByRole('listbox', { name: 'Receiving process' });
    const p0Option = procListbox.querySelector('li[title="P0"]');
    fireEvent.click(p0Option!);

    const addAsgBtn = screen.getByRole('button', { name: 'Add assignment' });
    expect(addAsgBtn).not.toBeDisabled();
    fireEvent.click(addAsgBtn);

    const state = useLabStore.getState();
    expect(state.scenario.edges).toHaveLength(1);
    expect(state.scenario.edges[0]!.from).toBe('R0');
    expect(state.scenario.edges[0]!.to).toBe('P0');
    expect(state.scenario.edges[0]!.type).toBe('assignment');
  });

  it('Prevention panel shows all policies without truncation', () => {
    render(<Sidebar />);

    // Open Policies accordion
    fireEvent.click(screen.getByRole('button', { name: /Policies/i }));

    expect(screen.getByText('Break Hold & Wait')).toBeInTheDocument();
    expect(screen.getByText('Break No Preemption')).toBeInTheDocument();
    expect(screen.getByText('Break Circular Wait')).toBeInTheDocument();
    expect(screen.getByText('Mutual Exclusion')).toBeInTheDocument();

    expect(screen.getByText(/A process may only request a resource/i)).toBeInTheDocument();
    expect(screen.getByText(/A blocked process releases everything it holds/i)).toBeInTheDocument();
    expect(screen.getByText(/Resources are globally ordered/i)).toBeInTheDocument();
  });

  it('Resources grid inputs are sized to ensure resource name and instances are visible', () => {
    act(() => {
      const store = useLabStore.getState();
      store.addResource();
    });

    render(<Sidebar />);

    // Open Resources accordion
    fireEvent.click(screen.getByRole('button', { name: /Resources/i }));

    const nameInput = screen.getByLabelText('Rename R0');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('Resource 0');

    const instancesInput = screen.getByLabelText('Instances for R0');
    expect(instancesInput).toBeInTheDocument();
    expect(instancesInput).toHaveValue(1);

    // Update instances
    fireEvent.change(instancesInput, { target: { value: '3' } });
    expect(useLabStore.getState().scenario.resources[0]!.totalInstances).toBe(3);
  });

  it('sidebar is scrollable only when an accordion dropdown is open', () => {
    render(<Sidebar />);

    const scrollableArea = screen.getByTestId('sidebar-scrollable');

    // Initially collapsed: overflow-hidden
    expect(scrollableArea).toHaveClass('overflow-hidden');
    expect(scrollableArea).not.toHaveClass('overflow-y-auto');

    // Click on Processes dropdown to open
    const processesBtn = screen.getByRole('button', { name: /Processes/i });
    fireEvent.click(processesBtn);

    // Now open: overflow-y-auto
    expect(scrollableArea).toHaveClass('overflow-y-auto');
    expect(scrollableArea).not.toHaveClass('overflow-hidden');

    // Click again to close
    fireEvent.click(processesBtn);
    expect(scrollableArea).toHaveClass('overflow-hidden');
    expect(scrollableArea).not.toHaveClass('overflow-y-auto');
  });

  it('Import and Export buttons have compact unified size and styling', () => {
    render(<Sidebar />);

    const importBtn = screen.getByRole('button', { name: /Import a scenario/i });
    const exportBtn = screen.getByRole('button', { name: /Export this scenario/i });

    expect(importBtn).toHaveClass('h-[32px]');
    expect(exportBtn).toHaveClass('h-[32px]');
    expect(importBtn).toHaveClass('text-[12px]');
    expect(exportBtn).toHaveClass('text-[12px]');
  });
});
