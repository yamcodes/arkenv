# Change: Adequate Testing for @arkenv/cli

## Why

`@arkenv/cli` currently has interactive scaffolding behavior but no dedicated automated test suite. This creates release risk in the most failure-prone paths:

- prompt flow and cancellation handling
- framework/package-manager detection heuristics
- tsconfig strict-mode checks and updates
- file overwrite and write behavior
- dependency install command construction and error handling

Because the CLI executes writes and shell commands in user projects, regressions have high user impact and are expensive to debug after publish.

## What Changes

- Define a formal OpenSpec requirement set for CLI testing adequacy under `scaffolding-cli`.
- Establish a minimum automated test matrix for `@arkenv/cli` covering:
  - unit tests for pure logic
  - integration tests for scaffold behavior with real filesystem temp fixtures
  - command-level smoke tests for CLI help and invalid command behavior
- Require deterministic test execution by mocking prompt and process boundaries where appropriate.
- Add testing documentation and CI expectations for the CLI package.

## Impact

- **Affected package**: `packages/arkenv-cli`
- **Primary outcome**: reduced regression risk for interactive setup flows
- **Scope**: testing requirements and implementation tasks only; no change to CLI user-facing features
