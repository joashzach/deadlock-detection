# PRD: DeadlockLab — Deadlock Detection & Prevention Simulator

> **How to use:** Place `design.md` in the project root, then paste this entire document into your AI coding agent as the first message. The agent must follow the phases in order and may not skip any test gate.

---

## 0. Agent Instructions (read first)

You are a senior full-stack engineer. Build **DeadlockLab**, an interactive educational web app that simulates processes and resources and implements algorithms to **detect**, **avoid/prevent**, and **recover from** deadlocks.

**Source-of-truth order (highest wins):**
1. `design.md` (supplied by the user in the project root) — governs *all visual design*: colors, typography, spacing, radii, shadows, component styling, iconography, motion tone.
2. This PRD — governs behavior, features, algorithms, architecture, and tests.
3. Your own judgment — only where 1 and 2 are silent; record it in `DECISIONS.md`.

**Before writing any code:** read `design.md` fully, then restate in 5–8 bullets the design rules you will apply (tokens, fonts, theme, component style). Map its tokens into Tailwind config / CSS variables once, and use only those tokens everywhere — **no hard-coded colors, fonts, or spacing in components.** If `design.md` is missing, say so and use the fallback tokens in Section 5.4.

**Non-negotiable rules:**
1. **Correctness before polish.** The algorithm engine is pure TypeScript with no React imports and is fully tested before any UI depends on it.
2. **Run tests for real.** After each phase, run the commands, paste the actual output, and fix every failure at its root cause. Never claim "tests pass" without running them. Never delete, skip, or weaken a test to make it pass.
3. **No fakes.** No lorem ipsum, TODO stubs, mocked results, or hard-coded outputs. Every visual and every explanation must be generated from the real engine's output.
4. **No silent failures.** Handle invalid input explicitly (clear message in the UI, typed error in the engine). Wrap the app in an error boundary. Zero console errors or warnings.
5. **Deterministic.** Same scenario + same seed = same result and same step trace, every time.
6. **Phased delivery (Section 9).** Stop and report at each gate.
7. If something is ambiguous, pick the simplest reasonable option, log it in `DECISIONS.md`, and continue.

---

## 1. Product Overview

**Problem:** Deadlocks are hard to grasp from textbooks. Students need to *see* processes and resources interact, watch algorithms run step by step, and compare strategies.

**Goal:** A client-side web app where users build or load a scenario of processes and resources, run detection, avoidance, prevention, and recovery with step-by-step visuals and plain-language explanations, and learn the theory.

**Audience:** OS/CS students, instructors, interview candidates.

**Concepts covered:** the four Coffman conditions, Resource Allocation Graph (RAG), Wait-For Graph (WFG), detection (single- and multi-instance), prevention (breaking each Coffman condition), avoidance (Banker's algorithm), recovery (termination, preemption).

---

## 2. Tech Stack (pin exact versions in `package.json`; Node ≥ 20)

| Area | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`) |
| Styling | Tailwind CSS, theme generated from `design.md` tokens via CSS variables |
| Graph rendering | Custom SVG (justify any library in `DECISIONS.md`) |
| Animation | Framer Motion; honor `prefers-reduced-motion` |
| State | Zustand; engine state is immutable (never mutate in place) |
| Unit/component tests | Vitest + React Testing Library + `@vitest/coverage-v8` |
| E2E | Playwright (Chromium; add Firefox/WebKit smoke if available) |
| Quality | ESLint + Prettier |

No backend, no network calls at runtime, no analytics. Persist to `localStorage` (guarded with try/catch and schema version) and support JSON import/export with schema validation (e.g., Zod).

---

## 3. Architecture

```
design.md                # provided by user
src/
  engine/                # PURE TS, zero React/DOM imports
    types.ts             # Process, Resource, Edge, SystemState, Step, EngineError
    validate.ts          # scenario validation (typed errors)
    rag.ts               # RAG model, RAG→WFG conversion
    detect/cycleDetect.ts    # single-instance: DFS cycle detection on WFG
    detect/matrixDetect.ts   # multi-instance: Allocation/Request/Available
    avoid/bankers.ts         # safety algorithm + resource-request algorithm
    prevent/policies.ts      # hold&wait, no-preemption, circular-wait ordering, mutual-exclusion note
    recover/recovery.ts      # victim selection, termination, preemption
    simulator.ts             # tick engine: request/grant/block/release semantics
  scenarios/             # preset scenarios (JSON, schema-validated)
  components/ pages/ hooks/ store/ styles/
tests/ (unit)  e2e/ (playwright)
```

**Key design rule — traces:** every algorithm returns `{ result, steps: Step[] }`. A `Step` has `id`, `title`, `explanation` (plain English, generated from actual values), `pseudocodeLine`, `highlight` (node/edge/matrix-cell ids), and `snapshot` (immutable state). The UI only *replays* traces; it never recomputes results itself. Every trace is non-empty and ends with a terminal conclusion step.

**Definitions (use consistently in code, UI, and tests):**
- **Deadlocked set** = all processes that can never finish under the current state (the matrix-algorithm definition). This includes processes on a wait cycle *and* processes permanently blocked waiting on them.
- **Cycle members** = processes on a WFG cycle (a subset of the deadlocked set for single-instance systems).
- A process that is not waiting on anything is never deadlocked.

---

## 4. Functional Requirements

### 4.1 Scenario Builder
- Add/remove/rename processes (P0…Pn) and resources (R0…Rm); each resource has 1–10 instances. Limits: ≤ 20 processes, ≤ 20 resources.
- Create **request** (P→R) and **assignment** (R→P) edges with validation: cannot assign more than a resource's free instances; no duplicate edges for single-instance resources; Request/Need cannot exceed declared Max; removing a node removes its edges.
- Drag nodes; auto-layout button; zoom/pan; fit-to-screen.
- **Matrix view** (editable): Allocation, Max, Need, Request, Available — always in sync with the graph (single source of truth in the store; one derives the other).
- **Presets (≥ 6):** classic 2-process deadlock · safe system · 3-process circular wait · dining philosophers (5) · multi-instance safe (Banker's example, T3) · multi-instance deadlock (T5). Plus seeded "Random scenario".
- Import/export JSON (validated; show a readable error on bad files), reset, undo/redo.

### 4.2 Detection
1. **Single-instance:** convert RAG→WFG, run DFS cycle detection; highlight each cycle in the danger color, list cycle members and any other permanently blocked processes.
2. **Multi-instance:** matrix algorithm — `Work = Available`; `Finish[i] = true` if `Allocation[i]` is all zeros; repeatedly pick unfinished `i` with `Request[i] ≤ Work`, set `Work += Allocation[i]`, `Finish[i] = true`; processes still unfinished are deadlocked.
3. Auto-select the algorithm from the scenario; allow manual override (with a warning if the override is inappropriate, e.g., WFG on multi-instance).
4. **Result banner:** "Deadlock detected: {P1, P2}" or "No deadlock", plus a live checklist of which Coffman conditions currently hold and why.

### 4.3 Avoidance (Banker's Algorithm)
- **Safety algorithm** with step-by-step Work vector, Finish flags, chosen process per iteration, and the final safe sequence (or "unsafe").
- **Resource-request algorithm:** user picks a process and a request vector. Outcomes: **Granted (safe)**, **Denied (unsafe)**, **Must wait (not enough available)**, **Error (exceeds declared Need)** — each with the exact reason. Granting applies the allocation to the state; denial leaves state unchanged.

### 4.4 Prevention (policy toggles; each enforced in the live simulator)
- **Break Hold & Wait:** all-or-nothing atomic acquisition of the full resource set.
- **Break No Preemption:** a blocked process releases everything it holds (or resources are preempted from a waiting holder) per a selectable mode.
- **Break Circular Wait:** global resource ordering by index; requesting a lower-indexed resource while holding a higher-indexed one is rejected.
- **Mutual Exclusion:** informational card explaining why it usually can't be removed.
- When a policy blocks or alters an action, show a toast and log entry naming the policy, the rule, and the Coffman condition it protects.

### 4.5 Live Simulator
- Each process has an editable **script**: ordered `request R_x`, `release R_x`, `compute(n)`; a script library for presets.
- Controls: **Play / Pause / Step / Reset**, speed 0.25×–4×, seed input.
- Event log (timestamped), process state chips (Ready, Running, Waiting, Finished, Deadlocked), resource availability bars.
- **Side-by-side comparison:** same scripts and seed, "no prevention" vs "with selected policies".
- Optional continuous detection every N ticks; flag the exact tick at which deadlock first occurs. The simulator terminates (finished, deadlocked, or max-tick guard) — it must never loop forever.

### 4.6 Recovery
After detection offer **terminate all**, **terminate one at a time** (victim: fewest resources held, or user pick), and **preempt resources**. Show before/after state, then automatically re-run detection to confirm resolution.

### 4.7 Learn Section
- Panels: *What is a deadlock*, *Four Coffman conditions* (interactive checklist bound to the current scenario), *RAG vs WFG*, *Detection*, *Prevention vs Avoidance vs Recovery*, *Complexity table*.
- Every algorithm has a **pseudocode panel**; the current line highlights during step-through (driven by `Step.pseudocodeLine`).
- **Quiz:** ≥ 8 questions, instant feedback with explanation, final score, retry.

---

## 5. UI / UX Requirements

### 5.1 Design source
**`design.md` is authoritative for all visual decisions** (see Section 0). This PRD defines *what* appears and *where*; `design.md` defines *how it looks*. If `design.md` specifies light/dark themes, implement both with a toggle; otherwise follow its single theme.

### 5.2 Layout (desktop ≥ 1024px)
- **Top bar:** logo, scenario dropdown, algorithm selector, theme toggle (if applicable), import/export.
- **Left sidebar (collapsible):** builder tools, presets.
- **Center:** graph canvas (primary focus) with floating playback bar.
- **Right panel (tabs):** Explanation · Matrices · Log · Pseudocode.
- **Bottom:** status banner with detection/avoidance result.
- **Tablet/mobile:** stacked layout; panels become bottom sheets; canvas works with touch (drag, pinch-zoom).

### 5.3 Semantics the visuals must express (styling from `design.md`)
- Process nodes and resource nodes are visually distinct; resource nodes show instance dots (filled = allocated).
- Request edges are dashed; assignment edges are solid; arrowheads show direction.
- Deadlock cycles are emphasized (color **and** icon/label **and** subtle pulse — never color alone).
- Semantic states needed: neutral, active/highlighted, success/safe, warning/waiting, danger/deadlock.
- Pages: `/` Landing (hero, 3-step "how it works", CTA) · `/lab` Simulator · `/learn` Theory · `/quiz` · `/about`.

### 5.4 Fallback tokens (use ONLY if `design.md` is absent)
Dark theme. Background `#0B1020`, surface `#121A30`, border `#223052`, text `#E6EAF5`, muted `#8A97B8`, accent `#6366F1`, success `#22C55E`, warning `#F59E0B`, danger `#EF4444`. Fonts: Inter (UI), JetBrains Mono (matrices/logs/code). 8px grid, rounded-xl cards.

### 5.5 UX & quality bar
- Each step explains *what happened* and *why* in plain language using real values.
- Empty states, loading skeletons, friendly errors, undo for destructive actions.
- Keyboard shortcuts (Space play/pause, → step, R reset, ? shortcuts modal).
- Accessibility: WCAG AA contrast, full keyboard navigation, visible focus, ARIA labels on nodes/controls, `aria-live` for status changes, reduced-motion support.
- Performance: smooth at 20×20; engine < 50 ms typical; no layout shift.

---

## 6. Reference Test Data (authoritative — use exactly)

**T1 — Classic deadlock (single-instance):** P1 holds R1, requests R2; P2 holds R2, requests R1 → deadlocked {P1, P2}.

**T2 — No deadlock (chain):** P1 holds R1, requests R2; P2 holds R2, requests nothing → no deadlock.

**T3 — Banker's safe state** (Available = [3,3,2]; totals A=10, B=5, C=7):

| | Alloc | Max |
|---|---|---|
| P0 | 0 1 0 | 7 5 3 |
| P1 | 2 0 0 | 3 2 2 |
| P2 | 3 0 2 | 9 0 2 |
| P3 | 2 1 1 | 2 2 2 |
| P4 | 0 0 2 | 4 3 3 |

- Safe; `<P1, P3, P4, P0, P2>` is valid. Tests assert that the returned sequence is *valid* (simulate it), not that it equals one fixed order.
- Request P1 = [1,0,2] → **Granted**.
- Then P4 = [3,3,0] → **Must wait** (not available).
- Then P0 = [0,2,0] → **Denied (unsafe)**.
- Any request exceeding Need → **Error**.

**T4 — Multi-instance detection, no deadlock** (Available = [0,0,0]):

| | Alloc | Request |
|---|---|---|
| P0 | 0 1 0 | 0 0 0 |
| P1 | 2 0 0 | 2 0 2 |
| P2 | 3 0 3 | 0 0 0 |
| P3 | 2 1 1 | 1 0 0 |
| P4 | 0 0 2 | 0 0 2 |

→ No deadlock (e.g., order P0, P2, P3, P1, P4).

**T5 — T4 with P2 Request = [0,0,1]** → deadlocked {P1, P2, P3, P4}.

**T6 — Circular-wait prevention:** with ordering R1<R2<R3, a process holding R2 requesting R1 is **rejected**; requesting R3 is **allowed**.

**T7 — Hold-and-wait prevention:** a process needing {R1, R2} when only R1 is free receives **nothing** (no partial grant).

**T8 — Dining philosophers (5):** all pick the left fork first → deadlock detected; with ordering policy enabled → run completes, no deadlock.

---

## 7. Testing Requirements (mandatory)

**Scripts in `package.json`:**
```
npm run test         # vitest run (unit + component)
npm run test:cov     # vitest run --coverage
npm run test:e2e     # playwright test
npm run typecheck    # tsc --noEmit
npm run lint
npm run verify       # typecheck + lint + test:cov + build + test:e2e
```

**Unit tests (engine):**
- T1–T8 as individually named tests.
- Edge cases: empty system; single process; process with no edges; self-wait; resource with 0 free instances; request exceeding Max/Need; duplicate edges; multiple disjoint cycles; a bystander process (not waiting) never flagged; a process blocked on a deadlocked process *is* in the deadlocked set but not in the cycle members; invalid input throws typed `EngineError`.
- **Cross-check property test:** 500 seeded random single-instance scenarios — the cycle detector and matrix detector must agree that deadlock exists/doesn't, cycle members ⊆ matrix deadlocked set, and the deadlocked set = cycle members plus processes that can reach a cycle in the WFG.
- **Invariants:** allocations never exceed totals; Available = Total − ΣAllocation; after recovery, re-detection reports no deadlock; every trace is non-empty and ends with a conclusion step; same seed ⇒ identical trace; simulator always terminates.
- **Banker's property test:** for 200 random states, a granted request always leaves the state safe.

**Component tests:** builder validation, matrix↔graph sync, banner correctness per preset, error boundary renders on forced failure, import rejects malformed JSON.

**E2E (Playwright):**
1. `/lab` → "Classic deadlock" → Detect → danger banner naming P1, P2; cycle edges emphasized.
2. "Safe system" → Banker's → safe sequence shown; success banner.
3. Submit unsafe request → "Denied (unsafe)" with reason.
4. Dining Philosophers: without policy → deadlock; enable Resource ordering → Play → completes without deadlock.
5. Step-through updates explanation text and pseudocode line highlight.
6. Export JSON → reset → import → identical scenario.
7. Recovery: terminate victim → re-detection shows no deadlock.
8. Quiz: answer, feedback, final score.
9. Mobile 390×844: no horizontal scroll, canvas usable, bottom sheets work.
10. Every page loads with zero console errors.

**Coverage:** ≥ 90% lines and ≥ 85% branches on `src/engine/`. Report the numbers.

---

## 8. Definition of Done

- [ ] `npm run verify` exits 0; real output pasted in the final report.
- [ ] T1–T8, property, invariant, and e2e tests all pass; coverage targets met.
- [ ] UI visibly follows `design.md`; no hard-coded colors/fonts in components (grep to confirm).
- [ ] Every preset works end to end with correct results and step explanations.
- [ ] Zero console errors/warnings; Lighthouse Accessibility ≥ 90, Performance ≥ 85.
- [ ] Works in latest Chrome, Firefox, Safari; usable at 390px width.
- [ ] `npm run build` succeeds and `npm run preview` serves it.
- [ ] `README.md` (setup, scripts, architecture, screenshots) and `DECISIONS.md` exist.

---

## 9. Execution Phases (in order; report at each gate)

**Phase 0 — Design intake.** Read `design.md`; post the 5–8 bullet design summary; generate Tailwind theme + CSS variables from it. *Gate:* summary posted.

**Phase 1 — Scaffold & Engine.** Scaffold the stack; implement the full engine with traces; write unit, property, and invariant tests (T1–T8). *Gate:* run `npm run typecheck && npm run test:cov`; paste output; coverage targets met. Do not proceed until green.

**Phase 2 — Core UI.** Layout shell, graph canvas, builder, matrix editor, presets, detection banner — all wired to the real engine. *Gate:* component tests green; verify every preset manually in the browser.

**Phase 3 — Algorithms in the UI.** Step-through playback, explanation panel, pseudocode highlighting, Banker's request form, prevention toggles, live simulator with side-by-side comparison, recovery. *Gate:* re-run all tests; no regressions.

**Phase 4 — Learn, Quiz, Landing, Polish.** Learn pages, quiz, landing, shortcuts, theme, accessibility and responsive passes, import/export, undo/redo, error boundary. *Gate:* lint + typecheck + tests green.

**Phase 5 — E2E & Hardening.** Write and run all Playwright tests; fix failures at the root cause; run Lighthouse; finalize docs. *Final gate:* `npm run verify` passes.

**Final report must include:** exact test counts, coverage table, Lighthouse scores, a checklist mapping each PRD section to what was implemented, and any known limitations. Before reporting, self-review: re-read Sections 4 and 8 and confirm each item against the running app.

---

## 10. Out of Scope
Backend/auth, real OS integration, multi-user collaboration, distributed deadlock detection (mention only as "Further reading").
