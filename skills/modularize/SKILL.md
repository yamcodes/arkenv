---
name: modularize
description: Automatically refactor, split, and compress codebase files when they exceed size or complexity boundaries. Trigger when the user requests to split a file, modularize code, or refactor a large module, and when files exceed size (~200 lines) or complexity guidelines.
metadata:
  internal: true
---

# Modularize

A skill for automatically refactoring, splitting, and compressing codebase files when they exceed size or complexity boundaries.

## 1. Core Heuristics & Guardrails

Rather than enforcing a strict, rigid line count, utilize \~200 lines as a **warning light/signal** to evaluate logical cohesion and maintainability.

### Heuristics to Evaluate Before Refactoring:

- **Logical Cohesion**: Does the file focus on one primary concern? Or does it contain independent blocks?
- **Function/Block Size**: Prioritize keeping functions small (under 20-30 lines) first.
- **Nesting/Complexity**: High cyclomatic complexity/nesting vs. simple flat lists.
- **Fragmentation Risk**: Avoid "jump-to-definition" fatigue by not over-splitting cohesive units.

### Guardrails:

- **The "Abort" Condition**: Skip refactoring if the file is predominantly a configuration dictionary, list of constants, or single massive switch statement that logically belongs together.
- **API Contract Preservation**: Maintain public APIs using barrel files (e.g., `index.ts`) to re-export split modules, preventing breaking changes for consumers.
- **Dependency Injection**: Favor passing context via arguments rather than creating tangled relative imports (e.g., `../../../`).

---

## 2. Refactoring Patterns

### A. Test Files

For large test suites (e.g., splitting a 600+ line test file):

- **Split by Behavior/Topic**: Group tests into separate files named after the feature or option under test (e.g. `coercion.test.ts`, `arrays.test.ts`, `options.test.ts`, etc.).
- **Shared Setup**: Extract common setup, beforeEach/afterEach hooks, mocks, or helper functions into a small local test utility or shared helper file, but only when duplication is real and significant.
- **Run Focused Tests**: After splitting, run the affected test suite files individually before running the wider project check.

### B. Source Modules

For CLI commands, components, or services:

- **Isolate Concerns**: Isolate interactive UI prompts, file system adapters, API clients, and terminal reporters into discrete sub-modules.
- **High-Level Orchestrator**: Keep the original file purely as a high-level orchestrator that coordinates the sub-modules.
- **Avoid Speculative Abstractions**: Avoid creating generic reusable classes/functions before there are multiple active callers. Keep them as local module splits first.

---

## 3. Step-by-Step Workflow

1. **Inspect & Classify**: Read the file, identify dependencies/imports, and evaluate heuristics to decide whether to refactor or abort.
2. **Design Boundaries**: Formulate a plan for the split. Define clear boundaries, minimal interfaces, and ensure no public contracts are broken.
3. **Incremental Execution**: Extract sub-modules or smaller test files in small, logical batches. Check compilation/type-checking at each step.
4. **Update Imports & Exports**: Re-wire caller modules, update barrel/index files, and resolve imports cleanly.
5. **Verify**: Run the targeted tests and typecheck workspace validation.
