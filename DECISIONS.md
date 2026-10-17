# Architectural & Design Decisions

This document records architectural, algorithmic, and design decisions made where `DESIGN.md` and `deadlock-lab-prd.md` are silent or open to implementation choices.

## 1. Design System & Tokens
- **Theme**: Light theme based on `DESIGN.md` ("Terminal man-page in daylight"). Canvas is `#fafafa`, text `#414141`, headings `#000000`, muted `#737373`, borders `#c1c1c1`, inverse `#111111`.
- **Accents**: Ember `#f35815` for primary action pills and 2px vertical headline accents. Signal Blue `#0b6ec5` for links. Amber `#f2b600` for callouts and tag highlights.
- **Radii**: 9999px for buttons and tags; 0px for panels, cards, inputs, and tabs.
- **Typography**: Strictly `ui-monospace` across the entire application.

## 2. Graph Rendering
- **SVG vs Canvas/Library**: Custom SVG implementation chosen as specified in PRD Section 2. Custom SVG allows direct DOM integration, zero external library overhead, crisp vector rendering on all display resolutions, easy ARIA accessibility labels on graph nodes, and precise dashed/solid marker styling conforming to the design tokens.

## 3. Pure TypeScript Engine
- Engine in `src/engine/` is completely decoupled from React, DOM, or browser globals.
- All algorithms return `{ result, steps: Step[] }` with immutable snapshot clones (`structuredClone`), human-readable dynamic explanation strings, pseudocode line references, and highlighted element IDs.
- Deterministic pseudo-random number generator (Mulberry32 or SplitMix32) used for all seeded random scenario generation and simulator ticks to guarantee reproducible step traces.

## 4. Multi-Instance Detection Correctness (deviation from the textbook initialization)
The Silberschatz detection algorithm initializes `Finish[i] = true` whenever `Allocation[i]` is all zeros. That shortcut is **incorrect for the PRD's definition of the deadlocked set**, which explicitly includes "processes permanently blocked waiting on them". A process that holds nothing but is waiting on a resource held by a deadlocked process can never finish, yet the textbook initialization would pre-mark it finished.

DeadlockLab therefore initializes `Finish[i] = true` **only when a process holds nothing *and* requests nothing** (so it is genuinely not waiting on anything). Every other process is simulated, so a zero-allocation process that is waiting is correctly reported as deadlocked. This was caught by the 500-case cross-check property test and makes the matrix detector agree exactly with the single-instance WFG detector (cycle members plus every process that can reach a cycle).

## 5. Single-Instance Detector vs. Matrix Detector Agreement
- For single-instance systems, `detectDeadlock` auto-selects the WFG DFS cycle detector; the matrix detector remains available as a manual override. A 500-case seeded property test asserts both detectors report identical deadlocked sets, that cycle members are a subset of the matrix deadlocked set, and that `Available = Total − ΣAllocation` always holds.

## 6. Routing
- `react-router-dom` v6 with the `v7_startTransition` and `v7_relativeSplatPath` future flags enabled, so the app boots with zero console warnings. A tiny dependency was preferred over hand-rolling history handling, since deep-linkable pages (`/`, `/lab`, `/learn`, `/quiz`, `/about`) are a PRD requirement.

## 7. Scenario representation (single source of truth)
- The store keeps the scenario as `{ processes, resources, edges, max? }`. Allocation, Request, Need, and Available are **always derived** from the graph via `deriveMatricesFromRAG`, so the graph and the matrices can never disagree.
- `Available` is therefore read-only in the matrix editor (the invariant `Available = Total − Σ Allocation` is enforced by construction); change a resource's total instance count instead. Editing Allocation/Request edits the corresponding graph edges; editing Need sets `Max = Allocation + Need`.

## 8. Semantic state colours
- `DESIGN.md` defines a strictly monochrome palette plus one warm accent, and states meaning must never rely on colour alone. Semantic states therefore pair a token colour with a glyph and a text label everywhere:
  - **danger / deadlock** → Ember `#f35815` fill (the palette's only warm accent) + `⚠` + label + a subtle pulse (disabled under `prefers-reduced-motion`).
  - **warning / waiting** → Amber `#f2b600` fill + `…` + label.
  - **success / safe** → Obsidian `#111111` inverted fill + `✓` + label (kept monochrome rather than inventing a green).
  - **active / highlighted** → Ink Black `#000000` stroke + heavier weight.
- No proportional fonts, shadows, or rounded cards are introduced; radii stay `9999px` for buttons/chips and `0px` for panels, inputs, and tabs.


