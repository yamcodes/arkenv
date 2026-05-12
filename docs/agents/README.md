# Agent Documentation

This directory contains configuration and guidance for AI agents (like Gemini CLI) to help them understand this repository's workflows, issue tracking, and domain language.

## Purpose

The files here are read by engineering skills to ensure agents act consistently with the project's established conventions. They are **not** intended for general human consumption or external users.

## Documentation Map

If you are looking for other types of documentation, please refer to:

- **Internal Project Docs**: Found at the repo root (e.g., `README.md`, `AGENTS.md`) or in the `.github/` directory (e.g., `CONTRIBUTING.md`, `TESTING.md`).
- **External/User Documentation**: For usage of public packages (like `arkenv`) or non-internal skills, see the documentation site content in `apps/www/content/docs/`.
- **Project Context**: The primary source of truth for the project's domain language is `CONTEXT.md` at the root.

## Files in this directory

- `issue-tracker.md`: Instructions for interacting with the project's issue tracker.
- `triage-labels.md`: Mapping of canonical triage roles to the actual labels used in the issue tracker.
- `domain.md`: Rules for how agents should consume and contribute to domain documentation.
