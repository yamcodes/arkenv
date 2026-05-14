# ArkEnv Skills

This directory contains skills for AI agents to help them understand and use ArkEnv more effectively.

## Available Skills

These skills are intended for users of ArkEnv to improve their development experience.

- [**arkenv**](./arkenv/SKILL.md): Core ArkEnv usage, schema definition, CLI commands, and best practices.

<details>
  <summary>Internal Skills</summary>

  These skills are optimized for contributors and maintainers of this repository. They are marked with `internal: true` in their metadata.

  Internal skills are automatically discovered by agents within this workspace via symlinks in `.agent/`, `.gemini/`, and `.github/`.

  ### GitHub Workflows

  - [**gh-cli**](./gh-cli/SKILL.md): Guidance for using the GitHub CLI (`gh`) for common repository tasks.
  - [**gh-issue-workflow**](./gh-issue-workflow/SKILL.md): Standardized workflow for managing issues from start to Pull Request.

  ### OpenSpec (Experimental)

  - [**openspec-propose**](./openspec-propose/SKILL.md): Propose new changes with full artifact generation.
  - [**openspec-explore**](./openspec-explore/SKILL.md): Deep-thinking and codebase investigation mode.
  - [**openspec-apply-change**](./openspec-apply-change/SKILL.md): Structured implementation of OpenSpec tasks.
  - [**openspec-archive-change**](./openspec-archive-change/SKILL.md): Finalizing and archiving completed changes.
  - [**internalize-skill**](./internalize-skill/SKILL.md): Promoting externally installed skills to project-internal skills.
</details>

## Installation

To add the official `arkenv` skill to your AI agent (like Cursor, Claude Code, etc.), run:

```bash
npx skills add yamcodes/arkenv
```

For more information about skills, visit [skills.sh](https://skills.sh).
