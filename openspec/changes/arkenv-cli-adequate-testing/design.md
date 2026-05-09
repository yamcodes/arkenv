# Design: Adequate Testing for @arkenv/cli

## Overview

This change defines and implements a test strategy for the `@arkenv/cli` package with a focus on behavioral safety over implementation details.

The design targets three layers:

1. **Unit**: deterministic logic and branch behavior
2. **Integration**: scaffold orchestration against temporary filesystem projects
3. **CLI smoke**: process-level command behavior (`--help`, invalid command)

## Goals / Non-Goals

**Goals:**
- Catch regressions in file generation and tsconfig mutation logic
- Validate framework/package manager detection heuristics
- Validate install command selection and failure handling
- Ensure cancellation/overwrite flows are covered without interactive TTY dependency

**Non-Goals:**
- Full interactive TTY E2E with real keypress automation
- Networked dependency-install verification against registries
- Snapshot-heavy testing of terminal cosmetics/colors

## Test Architecture

### 1) Unit Tests (fast, mocked boundaries)

Test pure or near-pure behavior with deterministic inputs:

- `getEnvTemplate()` returns correct template family per validator
- framework note selection for `vite` / `bun` / `node`
- install command selection by package manager
- tsconfig status detection (`strict`, `not_strict`, `not_found`) via temp fixtures

Where internals are currently not exported (e.g., install command helper), either:
- expose small testable helpers intentionally, or
- cover through higher-level scaffold tests.

### 2) Integration Tests (temp project fixtures)

Use temp directories and real file IO to exercise `scaffold()` and config helpers:

- writes new config file at target path
- does not overwrite existing file when overwrite is declined
- overwrites when accepted
- updates tsconfig strict mode when requested
- leaves tsconfig unchanged when already strict
- installs correct dependency set by framework (`@arkenv/vite-plugin`, `@arkenv/bun-plugin`, or none)
- surfaces actionable error when install command fails

Mock process boundaries:
- `@clack/prompts` confirm responses
- child process execution for package installation

### 3) CLI Smoke Tests (process-level)

Spawn the built CLI entry and assert:

- `--help` prints usage and exits `0`
- unknown command prints usage and exits `0`
- unhandled rejection path exits non-zero (if practical via controlled fixture)

These tests intentionally avoid interactive prompt driving and focus on stable contract behavior.

## Tooling and Organization

- Add `vitest.config.ts` for `packages/arkenv-cli` (or reuse root config with project entry)
- Co-locate tests in `packages/arkenv-cli/src/*.test.ts`
- Add package test scripts:
  - `test`
  - `test:run`
- Ensure root test command includes CLI project in CI

## Adequacy Gate (Definition of Done)

Testing is considered adequate only when all are true:

- Each critical workflow branch in `scaffold.ts` is covered by at least one automated test.
- CLI command contract (`help` + invalid command behavior) is process-tested.
- Failure paths are explicitly asserted (install failure, missing tsconfig, overwrite rejection).
- Tests run deterministically without network access and without requiring manual input.
