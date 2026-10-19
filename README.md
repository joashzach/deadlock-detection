# DeadLockLab

DeadLockLab is an interactive operating systems educational platform for exploring and understanding deadlock detection, prevention, and avoidance algorithms.

## Features
- **Live Simulator**: Deterministic multi-process simulation comparing baseline concurrency with active prevention policies side by side.
- **Resource Allocation Graph**: Interactive graph visualization with cycle detection, banker's algorithm safety analysis, and recovery steps.
- **Learn**: Interactive explanations of the Four Coffman Conditions, RAG vs. Wait-For-Graph reduction, and algorithm time/space complexities.
- **Quiz**: Self-paced knowledge checks with immediate feedback and explanation.
- **Unified Design System**: Clean, high-density, accessible layout adhering strictly to design tokens.

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Verification
```bash
npm run verify
```
This runs type checking, linting, unit test coverage, production bundle build, and Playwright end-to-end tests across viewports.
