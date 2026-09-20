# ArkEnv skills

This directory contains skills for AI agents to help them understand and use ArkEnv more effectively.

## Available skills

These skills are intended for users of ArkEnv to improve their development experience.

- [**arkenv**](./arkenv/SKILL.md): Core ArkEnv usage, schema definition, CLI commands, and best practices.

<details>
  <summary>Internal Skills</summary>

  These skills are optimized for contributors and maintainers of this repository. They are marked with `internal: true` in their metadata.

  Internal skills are automatically discovered by agents within this workspace via symlinks in `.agents/` and `.github/`.

  ### Design

  - [**the-hat**](./the-hat/SKILL.md): Hat → metrics → tier-list loop for comparing design alternatives across composing layers.

  ### Documentation

  - [**docs-writer**](./docs-writer/SKILL.md): Mechanics for writing, reviewing, and editing docs (links, wrapping, structure). Pair with **the-voice** for ArkEnv register.

  ### MCP Apps (SEP-1865)

  Upstream skills from [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps). Use when deepening `@arkenv/agent-plugin` with progressive UI (see [`docs/design/mcp-app.md`](../docs/design/mcp-app.md)).

  - [**add-app-to-server**](./add-app-to-server/SKILL.md): Enrich an existing MCP server's tools with `ui://` resources.
  - [**create-mcp-app**](./create-mcp-app/SKILL.md): Scaffold MCP App Views, lifecycle, and host integration patterns.

  Not selected (out of scope for ArkEnv agent surfaces): `convert-web-app`, `migrate-oai-app`.

  ### GitHub workflows

  - [**changeset**](./changeset/SKILL.md): Creates changesets for semantic versioning, version bumps, and package releases.
  - [**gh-cli**](./gh-cli/SKILL.md): Guidance for using the GitHub CLI (`gh`) for common repository tasks.
  - [**groom-issue**](./groom-issue/SKILL.md): Interactive grilling session to clarify and flesh out poorly written issues.
  - [**tackle-issue**](./tackle-issue/SKILL.md): Standardized workflow for managing issues from start to Pull Request.

  ### Code quality & refactoring

  - [**modularize**](./modularize/SKILL.md): Refactoring and splitting large files to reduce duplication and preserve public APIs.
  - [**internalize-skill**](./internalize-skill/SKILL.md): Promoting externally installed skills to project-internal skills.
</details>

## Installation

To add the official `arkenv` skill to your AI agent (like Cursor, Claude Code, etc.), run:

```bash
npx skills add yamcodes/arkenv
```

For more information about skills, visit [skills.sh](https://skills.sh).
