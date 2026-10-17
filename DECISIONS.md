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

## 9. Type-scale tokens are wired into Tailwind
- `DESIGN.md`'s typography scale lives in CSS custom properties (`--text-body-sm`, `--leading-*`, `--tracking-*`). Phase 3 added a matching Tailwind `fontSize` map so classes such as `text-body-sm` and `text-heading` resolve to those tokens instead of being silently dropped. No hard-coded pixel sizes are used in components.

## 10. A denied request is dropped, not retried (simulator)
- In the live simulator, a request rejected by a prevention policy with `remedyAction: 'REJECT'` (circular-wait ordering, hold-and-wait) **advances the process's program counter**: the request is denied and the process continues without acquiring that resource. Retrying the identical request forever would hold resources permanently and make a prevented run never terminate.
- This is what lets the required demo work: naive dining philosophers deadlock with no policy, and **complete** (all processes `Finished`, no deadlock ever detected) once resource ordering is enabled — the backwards request is denied so the cycle never closes. `breakNoPreemption` keeps its distinct `PREEMPT_HELD_RESOURCES` behaviour (release everything, then wait).

## 11. Simulations start from allocations only
- `initSimulator` builds its start state from the scenario's **assignment** edges only, dropping pre-existing request edges. A request edge on a scenario means "this process is already waiting", which is a mid-run snapshot; a simulation starts at tick 0 with processes `Ready`, and the scripts issue the requests.
- Without this, a preset that already encodes the wait (dining philosophers ship with `P_i → R_{(i+1)%5}`) would begin already deadlocked, so the enabled policy would never get to inspect the request and the "completes with ordering enabled" demonstration would be impossible. The engine is unchanged; only the stored start state is normalised, and the normalisation is documented here because it changes observable simulator behaviour.

## 12. Trace replay drives the canvas
- The centre canvas draws `useDisplayedScenario()`, which is the current trace step's snapshot whenever a trace is loaded and the editable scenario otherwise. That is what makes a Banker's provisional allocation or a recovery action visible step by step. Editing the scenario clears the trace (so the canvas returns to the editable state); a Banker's *grant* and a recovery action deliberately commit their new state **without** clearing the trace, so the user can still step back through how the state was reached.
- `detection` is kept separate from the trace: it always describes the *current* scenario, which is what the status banner and the deadlock emphasis should report.

## 13. `traceSteps` replaces `detectionSteps`
- Phase 2's `detectionSteps` only ever held detection traces. Phase 3 replays five kinds of trace (`detection`, `banker-safety`, `banker-request`, `recovery`, `simulation`), so the field and the playback bar are named for the trace, and the right panel picks its pseudocode by `traceKind`.

## 14. Motion is applied so it can never hide content
- `framer-motion` animates the explanation panel on step change and slides the policy toast in, and honours `useReducedMotion()` plus the CSS `prefers-reduced-motion` block.
- Entrances animate position (and, for text, opacity only from `0.85`) rather than from a fully transparent state, and the toast has no exit animation. If animation frames are throttled (background tab, headless browser), a message can therefore never be left stuck invisible or stuck mounted.

## 15. Prevention UI surfaces the rule behind every denial
- Both the toast and the Log panel render the same engine `policyNotice` (`policy`, `rule`, `coffmanCondition`), so the Coffman condition being enforced is always named in text, consistent with the "never colour alone" rule. The Mutual Exclusion policy is presented as an informational card because it is not one of the toggleable conditions.

## 16. Phase 4: persistence, shortcuts, accessibility, responsive
**Persistence (`src/lib/persistence.ts`, key `deadlocklab:workspace`, `STORAGE_VERSION = 1`)**
- The saved payload is `{ version, name, scenario, scripts, policies, seed, algorithm, labMode }`.
- The scenario is validated on the way back in through the *same* Zod schema used for file import (`parseScenarioJson`), so corrupt, truncated, or hand-edited data can never reach the pure engine. Unparseable JSON, a version mismatch, an invalid scenario, or absent storage all resolve to "no saved workspace" rather than an error.
- Untrusted scalar fields (`policies`, `seed`, `algorithm`, `labMode`) are coerced to defaults. Stored scripts are filtered to instructions whose resource still exists and to processes that still exist, and fall back to freshly generated defaults unless every process is covered — an unusable program can never be restored.
- Storage is reached through `getStorage()`, which tolerates both a missing `localStorage` and a throwing getter (private mode, disabled storage), and every read/write/remove is wrapped, so persistence is a convenience and never a hard dependency.
- `hydrateFromStorage()` (before the first render) and `attachPersistence()` (debounced 250 ms store subscriber) are called from `main.tsx` rather than inside the store module. That keeps the store side-effect free and means no test can inherit another test's saved workspace.
- The test environment's jsdom does not expose `window.localStorage`, so `tests/helpers/storage.ts` installs a real in-memory `Storage` (plus an always-failing variant) instead of mocking the persistence module — the storage API itself is exercised, including its failure modes.

**Keyboard shortcuts (`src/components/useKeyboardShortcuts.ts`, mounted once in `Layout`)**
- Space play/pause · `→` step forward · `←` step back · `R` reset · `?` dialog · `Esc` close · `Ctrl/⌘+Z` undo · `Ctrl/⌘+Shift+Z` or `Ctrl+Y` redo.
- Shortcuts never fire while focus is in an input, select, textarea, or contenteditable element, or the browser's own text undo would be stolen. Space is additionally left to focused buttons, links, and tabs, which activate on Space themselves. All playback keys are inert while the shortcuts dialog is open, since the dialog owns the keyboard.
- `R` is mode-aware: in Simulate mode it restarts the run, in Graph mode it rewinds the trace to step 0 and pauses, and it does nothing when there is no active run.
- `shortcutsOpen` is store state because two surfaces drive it (the global hook and the TopBar button); the rest of the Lab's UI state stays component-local.

**Accessibility**
- Skip link to `#main-content`; `aria-current="page"` on the active nav item; `aria-haspopup`/`aria-expanded` on both shortcuts buttons.
- Tabs carry `id`/`aria-controls` and their panels `role="tabpanel"`/`aria-labelledby` (workspace tabs and the Learn theory tabs); the Learn panel's `aria-labelledby` follows the selected tab.
- The shortcuts dialog is `role="dialog"` + `aria-modal="true"`, moves focus into itself, traps Tab, restores focus on close, and closes on `Esc` or a backdrop press.
- The mobile Builder/Analysis sheets are real toggles with `aria-expanded`, and `Esc` closes them.
- The Learn Coffman checklist states agreement with the engine as text (`✓`/`⚠` plus a sentence), never colour alone, and explains itself as unassessable when the scenario has no process or no resource.
- The dialog scrim is a token (`--surface-scrim` → `bg-scrim`) rather than an ad-hoc `rgba()`, preserving the no-hard-coded-colours rule.

**Responsive at 390 × 844**
- The header previously hid the nav and Import/Export behind `hidden md:flex`, which left narrow viewports with no way to reach the other pages. It is now a wrapping flex row: the nav drops to its own second line (`order-last w-full md:order-none md:w-auto`), Import/Export stay visible at every width, and Undo/Redo appear only in the Lab and only from `sm` up (the sidebar has its own pair).
- Verified with zero horizontal overflow on all five routes, including the simulator tables and the graph canvas.

**Two smaller corrections**
- The simulator's `free === 0` cell was Ember-coloured text, which `DESIGN.md` does not allow (Ember is a fill or accent, never text). It is now an Ember pill with a `⚠` glyph and a title, consistent with the semantic-state rule. The same fix removed Ember-as-text from the TopBar brand and the Landing step numbers.
- The complexity reference moved from a local constant in `About` to `src/lib/complexity.ts` and is now rendered as a real table by both `About` and the Learn "Complexity" panel, which previously only linked to About.


