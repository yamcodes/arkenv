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
  - [**groom-issue**](./groom-issue/SKILL.md): Interactive grilling session to clarify and flesh out poorly written issues.
  - [**tackle-issue**](./tackle-issue/SKILL.md): Standardized workflow for managing issues from start to Pull Request.

  ### Code Quality & Refactoring

  - [**modularize**](./modularize/SKILL.md): Refactoring and splitting large files to reduce duplication and preserve public APIs.
  - [**internalize-skill**](./internalize-skill/SKILL.md): Promoting externally installed skills to project-internal skills.
</details>

## Installation

To add the official `arkenv` skill to your AI agent (like Cursor, Claude Code, etc.), run:

```bash
npx skills add yamcodes/arkenv
```

For more information about skills, visit [skills.sh](https://skills.sh).
