# Examples

Worked example: `apps/www/content/docs/guides/ai.mdx`.

The meatier pre-plugin page (commit `5e69f5ebd`) already used the Turbo
shape. A later "tighten copy" pass stripped why. Restoring voice means
that lead and those "teaches assistants" bullets, plus a plugin H2 in the
**same** shape, not a skinny command dump.

## Skinny (how only)

> Use `@arkenv/agent-plugin` on hosts that support plugins or MCP. You
> get slash commands and an AST auditor.

No definition, no why, next line is the install.

## Stuffed (internals in a guide)

> That command reads the repo's `marketplace.json` and installs
> `packages/agent-plugin`. It exposes `/arkenv:init`… Each diagnostic
> includes `file`, `line`, `character`, `severity`, `ruleId`…

Diagnostic *shapes* belong in `/docs/reference/agent-plugin`. Do not
add a clone-path install in user docs.

## Target (what / why / how)

Lead (match Turbo, not a feature list):

> ArkEnv is designed to work seamlessly with AI coding assistants.
> ArkEnv provides features that help AI understand your environment
> schema and work more efficiently.

**Coding-agent plugin** H2: start with the ecosystem, not the package
name as "the" plugin.

> Most coding agents like Claude Code, Cursor, and Codex support
> plugins: a combination of skills, slash commands, and MCP tools.
> ArkEnv provides `@arkenv/agent-plugin` so those hosts can scaffold a
> project and catch unvalidated env access without grepping the tree.

Then `package-install` with `npx plugins add yamcodes/arkenv` only.
Ideal path after install: ask the assistant (or paste a prompt). Slash
commands are optional shortcuts in a Callout, not the default list.

**Agent skill** H2: fallback only. Open with a Callout, not a skip
sentence:

```mdx
<Callout type="info" title="Already installed the plugin?">
  Skip this section. The plugin already includes the skill. Use the
  skill only when the host cannot load plugins.
</Callout>
```

Then the open-standard one-liner and `npx skills add`.

**Prompts:** one sentence of why (consistent CLI use, no `runtimeEnv`
map), then the fenced prompts unchanged.

**Markdown docs:** "optimized for AI consumption" + why markdown beats
HTML (smaller context), then routes, `/llms.txt`, `/llms-full.txt`.
