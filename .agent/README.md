<!-- This file is for human eyes to understand the .agent directory structure and conventions -->
# Agent Configuration & Documentation

This directory is the central hub for AI agent metadata, configuration, and guidance. It is designed to keep the project root clean while providing agents with the context they need to operate effectively.

## Directory Overview

### Core Metadata
- **`AGENTS.md`**: The primary entry point for agents. It contains the "Agent Skills" block that defines how skills like `triage`, `to-prd`, and `diagnose` should operate in this repo.

### Skill Configuration (Matt Pocock's Engineering Skills)
Instructional documentation for automated skills, located in `.agent/docs/`:
- **`docs/issue-tracker.md`**: How to use the `gh` CLI to manage issues and PRDs.
- **`docs/triage-labels.md`**: Mapping of canonical triage roles (e.g., `needs-triage`) to this repo's specific GitHub labels.
- **`docs/domain.md`**: Rules for consuming and contributing to the project's domain documentation (`CONTEXT.md` and ADRs).

### Archived Platforms (`/platforms`)
Configuration for other AI platforms that are not currently the primary agent. To use these, move them to the root as described in their metadata:
- `.cursor/`: Cursor IDE configuration.
- `.claude/`: Claude Dev / Cline configuration.
- `copilot-instructions.md`: Custom instructions for GitHub Copilot.

## Documentation Map

If you are looking for other types of documentation, please refer to:

- **Internal Project Docs**: Found at the repo root (e.g., `README.md`, `AGENTS.md`) or in the `.github/` directory (e.g., `CONTRIBUTING.md`, `TESTING.md`).
- **External/User Documentation**: For usage of public packages (like `arkenv`) or non-internal skills, see the documentation site content in `apps/www/content/docs/`.
- **Project Context**: The primary source of truth for the project's domain language is `CONTEXT.md` at the root.
