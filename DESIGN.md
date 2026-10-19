# DeadLockLab Design System
> Precise, restrained, professional operating systems education design system.

## Philosophy & Core Principles
- **No decoration without a purpose**: No gradients, no glows, no emoji, no decorative icons, no pill shapes, no stat counters, no cards with drop shadows.
- **Square corners (0px border radius)** across all containers, inputs, buttons, chips, panels, dialogs, and segmented controls.
- **Hairline 1px borders** (`#DDE1EC`) defining surfaces, tables, panels, and data boundaries.
- **Flat elevation**: Zero shadows (`box-shadow: none`) across the entire system.
- **Dual-font discipline**:
  - **Poppins (500, 600 only)**: Exclusively for structural elements: logo, navigation, headings/titles, buttons, tab labels, segmented control, panel headings, section labels.
  - **JetBrains Mono (400, 500)**: Exclusively for text and data: all paragraphs and body text, form values, row labels, chips, tags, graph node labels, matrices, logs, pseudocode, numbers, status bar.
  - *Hard Rule*: Never put body text in Poppins; never put headings in mono.
- **Brand name**: Exactly "DeadLockLab" (one word, capital D, L, L) everywhere visible.

---

## Tokens — Colors

| Name | Hex Value | Token / CSS Variable | Role |
|------|-----------|----------------------|------|
| Navy (Primary Accent) | `#0F2557` | `--color-navy` | Primary brand accent, primary CTA fill, active tab underline, logo, active segmented control |
| Navy Hover | `#0B1B4D` | `--color-navy-hover` | Hover state for primary buttons |
| Page Tint | `#F3F5FA` | `--color-tint-bg` | App background, subtle panel fills, secondary hover tint |
| White | `#FFFFFF` | `--color-white` | Surfaces, card backgrounds, navbar background, panels |
| Ink | `#0B1220` | `--color-ink` | Headings, primary text, high-contrast structural text |
| Muted Text | `#566079` | `--color-muted` | Body text, explanations, captions, secondary labels, inactive tabs |
| Line / Border | `#DDE1EC` | `--color-line` | Hairline 1px borders, separators, tab divider rules |

### Semantic Colors
| State | Foreground Hex | Background / Tint Hex | Tokens | Role |
|-------|----------------|----------------------|--------|------|
| Danger | `#B42318` | `#FDECEA` | `--color-danger`, `--color-danger-tint` | Deadlock detected, cycle highlights, error messages |
| Success | `#067647` | `#E7F6EC` | `--color-success`, `--color-success-tint` | Deadlock-free, safe state, granted requests |
| Warning | `#B54708` | `#FEF0C7` | `--color-warning`, `--color-warning-tint` | Waiting states, unsafe preview, cautions |

- **No orange anywhere** in the system.
- Focus ring: `2px solid #0F2557`, `outline-offset: 2px`.
- Contrast: All foreground/background pairings exceed WCAG AA requirements (≥ 4.5:1).

---

## Tokens — Typography

### Primary Typeface: Poppins (`--font-poppins`, @fontsource/poppins)
- **Weights:** 500 (Medium), 600 (SemiBold)
- **Scale:**
  - `logo`: 24px / line-height 1.2 / 600
  - `nav`: 17px / line-height 1.4 / 500
  - `page title`: 24px / line-height 1.25 / 600
  - `h1`: 44px / line-height 1.15 / 600 / letter-spacing -0.015em
  - `h2`: 32px / line-height 1.2 / 600
  - `h3` / `right-panel heading`: 17px–22px / line-height 1.3 / 600
  - `panel heading`: 16px / line-height 1.3 / 600
  - `section label`: 12px / line-height 1.3 / 600 uppercase, letter-spacing .08em
  - `buttons`: 14px / line-height 1.3 / 500 / `white-space: nowrap`
  - `tabs`: 13px / line-height 1.3 / 500 / `white-space: nowrap`

### Monospace Typeface: JetBrains Mono (`--font-mono`, @fontsource/jetbrains-mono)
- **Weights:** 400 (Regular), 500 (Medium)
- **Scale:**
  - `mono body`: 14px / line-height 1.8
  - `mono small`: 12px–13px / line-height 1.5
  - `chips / tags`: 12px / line-height 1.4 / `white-space: nowrap`
  - `status bar`: 12px / line-height 1.5 / 500

---

## Tokens — Fluid Sizing & Density (Step 1)

```css
:root {
  --nav-h:        clamp(56px, 9.8vh, 88px);
  --status-h:     clamp(36px, 5.3vh, 48px);
  --ctrl-h:       clamp(32px, 4.4vh, 40px);   /* buttons, selects, inputs, segmented control */
  --row-h:        clamp(40px, 5.3vh, 48px);   /* accordion rows, list rows */
  --chip-h:       clamp(28px, 3.6vh, 32px);
  --pad:          clamp(16px, 1.7vw, 24px);   /* panel padding */
  --gap:          clamp(12px, 1.1vw, 16px);
  --sidebar-w:    clamp(232px, 19.5vw, 280px);
  --rightpanel-w: clamp(300px, 25vw, 360px);
  --page-pad-x:   clamp(24px, 6vw, 120px);    /* marketing/Learn/Quiz/About side padding */
  --fs-logo:      clamp(20px, 1.67vw, 24px);
  --fs-nav:       clamp(15px, 1.2vw, 17px);
  --fs-title:     clamp(20px, 1.67vw, 24px);
  --fs-h2:        clamp(22px, 2.2vw, 28px);
  --fs-h1:        clamp(30px, 3.1vw, 44px);
  --fs-panel-heading: clamp(14px, 1.1vw, 16px);
  --fs-btn:       clamp(13px, 0.97vw, 14px);
  --fs-body:      clamp(13px, 0.97vw, 14px);  /* mono body */
  --fs-small:     12px;                        /* never below 11px anywhere */
}
```

- **Base Rules:**
  - html font-size stays strictly 16px.
  - Reference design: 1440x900 where tokens resolve to 88/48/40/48/32/24/24/280/360.
  - Controls inside one toolbar must all use `--ctrl-h`.
  - Icon-only buttons are `--ctrl-h` square.
  - Base Grid: 8px steps. Headings sit 8px above body text; label to control = 8px; control to next label = 24px.
  - Scrollbars: thin custom scrollbars (`scrollbar-width: thin; scrollbar-color: #DDE1EC transparent`), shown only when genuinely overflowing. No scrollbars inside toolbars, button rows, or tab bars.
  - Border Width: 1px solid `#DDE1EC`.
  - Border Radius: 0px everywhere (`rounded-none`).
  - Shadows: none (`box-shadow: none`).

---

## Component Specifications

### 1. Global Navbar
- Height `var(--nav-h)`, white (`#FFFFFF`), 1px bottom border (`#DDE1EC`).
- Horizontal padding: `var(--pad)` (Lab) or `var(--page-pad-x)` (marketing/Learn/Quiz/About).
- Logo: "DeadLockLab" at the left (Poppins `var(--fs-logo)` 600, navy `#0F2557`).
- Navigation: Lab, Learn, Quiz, About at the right (Poppins `var(--fs-nav)` 500, `clamp(24px, 3vw, 44px)` gaps, full `var(--nav-h)` height so active underline sits on the bar's bottom border).
- Active tab: ink text (`#0B1220`) + 2px navy bottom border. Inactive: muted (`#566079`). Hover: ink.
- NO buttons, selects, or icons in the navbar (desktop).
- Responsive (< 768px): logo + menu button (Poppins); tabs open as a full-width dropdown list (48px rows).

### 2. Button
- Height `var(--ctrl-h)`, padding `0 clamp(12px, 1.1vw, 16px)`, Poppins `var(--fs-btn)` 500, `white-space: nowrap`, radius 0.
- Primary: navy fill (`#0F2557`), white text, hover `#0B1B4D`. Only ONE primary button per toolbar/view.
- Secondary: white fill, ink text, 1px `#DDE1EC` border, hover tint `#F3F5FA`.
- Disabled: 40% opacity, no hover, cursor not-allowed.
- Focus: 2px navy ring, 2px offset.
- Icon-only: `var(--ctrl-h)` square with aria-labels.

### 3. Input & Select
- Height `var(--ctrl-h)`, JetBrains Mono `var(--fs-body)`, 1px border `#DDE1EC`, padding `0 clamp(12px, 1.1vw, 16px)`.
- Left-aligned text (never centered).
- Focus: navy 1px border + 2px navy ring.
- Error: danger border + mono 12 danger message below.
- Focus: navy 1px border + 2px navy ring.
- Error: danger border + mono 12 danger message below.

### 4. Segmented Control
- Height 40px, 1px border `#DDE1EC`, each segment padding `0 24px`, Poppins 14/500.
- Active segment: navy fill (`#0F2557`) + white text.
- Inactive segment: white background + muted text (`#566079`).

### 5. Tabs
- Height ~40px–48px, Poppins 13/500, gap 16px, 1px bottom border.
- Active: ink (`#0B1220`) + 2px navy underline overlapping the bottom border.
- Inactive: muted (`#566079`).
- Horizontal scroll inside itself if width < 360px.

### 6. Accordion Row
- Height 48px, JetBrains Mono 14, 1px top border, count on right in muted.
- Expands in place to reveal form fields and secondary action buttons. One open at a time.

### 7. Chip & Tag
- Chip: height 32px, 1px border `#DDE1EC`, 6px state dot + label, mono 12, nowrap.
- Tag: mono 12, padding `4px 8px`, 1px border with semantic tint (danger / success / warning).

### 8. Panel
- White background (`#FFFFFF`), 1px solid `#DDE1EC` border, padding 24px, radius 0, shadow none.

### 9. Status Bar
- Fixed 48px height, white background, 1px top border `#DDE1EC`, padding `0 24px`, JetBrains Mono 12/500.
- Idle: "● Simulator idle".
- Detection: Result chip (danger/success) + Coffman conditions in one line.
- Fixed height: canvas must not move when Detect runs.

---

## Layout Rules

### Lab (/lab)
- Viewport: `100dvh`, page never scrolls; only inner areas scroll.
- App background: `#F3F5FA`.
- Desktop (≥ 1280px): `[sidebar 280px | main flex | right panel 360px]`, status bar 48px fixed at bottom.
- 1024px–1279px: sidebar 240px, right panel 320px, tabs 13px with horizontal scroll if needed.
- 768px–1023px (tablet): sidebar drawer opened by "Scenario" button in toolbar; right panel moves below main area as full-width tabbed section; simulator panels stay side by side.
- < 768px (mobile): single column; toolbar horizontally scrollable (touch targets ≥ 44px); panels stack vertically (graph height ≥ 280px); right panel tabbed section; status bar fixed at bottom; sidebar is full drawer. No horizontal scroll at 360px.

### Landing (/)
- Strictly 3 parts:
  1. Global Navbar
  2. Hero (background `#F3F5FA`, padding `96px 120px` [24px on mobile], 2 columns, gap 96px):
     - Left: h1 44/1.15/600 ink, mono paragraph 17/1.8 muted, max-width 480px.
     - Right: White figure card with 1px border, shadow none, mono header + live engine danger chip, live engine-rendered graph.
  3. "How it works" (white, padding `96px 120px` [24px on mobile]):
     - Poppins 32/600 heading, 48px gap, 3 equal columns with 2px ink top rule, mono 14 navy step number, Poppins 22/600 title, mono 15/1.8 muted text.
- No CTA buttons, no footer, no other sections.

### Learn (/learn)
- Side padding: 120px desktop, 24px mobile.
- Left sticky topic list (260px; active item has 2px navy left rule).
- Right content max 720px (Poppins h2, mono body).
- Coffman checklist bound to current scenario; RAG/WFG engine figures; complexity table in hairline mono.
- Mobile: topic list becomes horizontally scrolling tab bar.

### Quiz (/quiz)
- Centered column max 720px.
- Mono progress line; Poppins 22/600 question; full-width option rows (1px border, 56px min height, selected = navy border); verdict + explanation in mono; one primary Next/Retry button; arrow keys + Enter navigation.

### About (/about)
- Single column max 720px; Poppins h1; three short mono paragraphs.
