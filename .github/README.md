# GitHub & Repository Governance Configurations

This directory contains configurations, workflows, and internal documentation to manage the repository, automate processes, and document architectural design decisions. 

## Rationale for Location

To keep the repository root directory clean, all contributor-facing documentation, internal tools, and GitHub-specific configurations are centralized here instead of cluttering the root tree:

1. **Clean Root Principle**: Only files intended for consumers or basic project discovery (like `README.md`, `LICENSE`, `package.json`, and `CONTEXT.md`) reside at the root.
2. **Discoverable Context**: Internal documentation (contributing, testing) and decision records are maintained in a single place for contributors.

## Directory Map

- **`adr/`**: Contains sequentially-numbered Architecture Decision Records (ADRs) that document critical, trade-off-driven design choices made for the codebase. Start with `adr/README.md` and `adr/0000-use-architecture-decision-records.md`.
- **`openspec/`**: Contains the `changes/archive/` folder, preserving historical specs from our previous Spec-Driven Development workflow as context for past features. *Note: Active OpenSpec tooling has been decommissioned.*
- **`workflows/` and `actions/`**: GitHub Actions workflows for continuous integration (testing, type checking, biome checks) and publishing/releases.
- **`scripts/`**: Helper scripts for repository maintenance, builds, and development orchestration.

## Documentation Files

- **`CONTRIBUTING.md`**: Guide on how to set up the dev environment, code conventions, and submit contributions.
- **`TESTING.md`**: Instructions for running and writing unit, integration, and E2E tests.
- **`ACKNOWLEDGEMENTS.md`**: Credits and thanks to project contributors and dependencies.
