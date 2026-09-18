# “We need an MCP app” for ArkEnv

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note (no issue yet). **Chosen public story:** undecided lean — stack **A2 + B3 + C2 + D1**, with **B4/D2** as A-tier progressive enhancement. Do not treat “ship an MCP App” as the problem.

---

## Problem

Someone says “we need an MCP app for ArkEnv.” That sentence is not a problem statement. It collapses three different things:

1. **Colloquial:** “agents should be able to use ArkEnv” → skills, CLI `--agent`, MCP tools, plugin marketplaces.
2. **Protocol:** an MCP **server** that exposes tools/resources/prompts over stdio or HTTP.
3. **Spec (SEP-1865):** an **MCP App** — interactive HTML (`ui://`, `text/html;profile=mcp-app`) rendered in a host iframe, linked from tool `_meta.ui.resourceUri`.

What must be true when we are done:

1. A coding agent in a user repo can **scaffold** ArkEnv correctly (`init --agent`, JSON settlement, no hand-rolled `runtimeEnv` / ambient `.d.ts`).
2. The same agent can **detect and fix** env anti-patterns (raw `process.env` / `import.meta.env`, client leaks, public-prefix mistakes, leftover v0 ambient types) without inventing greps.
3. Capability works on **hosts that only speak plain MCP tools** (text/JSON). Interactive UI, if any, is progressive enhancement with a text fallback.
4. We do **not** rebuild a second agent surface that drifts from `@arkenv/agent-plugin`, the skill, or the CLI agent protocol.
5. Secrets stay out of chat UI and tool payloads by default (no dumping `.env` into iframes “because it looks cool”).

Already shipped today (baseline, not a blank canvas):

| Surface             | Where                                                   | What                                            |
| ------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| CLI agent protocol  | `arkenv init --agent` / `--json`                        | Machine-readable scaffold + refusals            |
| Skill               | `npx skills add yamcodes/arkenv` + plugin-bundled skill | Authorship / migration guidance                 |
| MCP tools           | `@arkenv/agent-plugin` stdio (`init`, `audit`)          | Tool calls wrapping CLI + AST audit             |
| Coding-agent plugin | `npx plugins add yamcodes/arkenv`                       | Skills + `/arkenv:init` / `/arkenv:audit` + MCP |
| Docs                | `/docs/guides/ai`                                       | Public install + prompt story                   |

So the hat is mostly about **interpreting the ask**, **what to deepen**, and **whether SEP-1865 UI is worth shipping** — not whether ArkEnv “has MCP.”

---

## Layer map

- **Layer A — Job depth:** what outcomes the agent surface is responsible for. Substitutes.
- **Layer B — Host surface:** how hosts discover and invoke that capability. Substitutes for the *primary* public story; MCP Apps (B4) **composes** with tools (B2/B3), it does not replace them.
- **Layer C — Package / runtime placement:** where the implementation lives and how it runs. Substitutes.
- **Layer D — Presentation richness:** how tool results are shown to humans. Composes with B2/B3; only meaningful if we keep tools.

Items on different layers compose into a **stack**. “MCP app vs skill vs CLI” is a false rivalry.

---

## Metrics

| Metric                          | Question                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Honesty to shipped surfaces** | Does the option acknowledge `@arkenv/agent-plugin` / CLI `--agent` / the skill, or does it invent a parallel universe? |
| **Agent reliability**           | Does the agent finish init/audit/migrate more often, with fewer invented APIs?                                         |
| **Host coverage**               | Works in Cursor, Claude Code, Codex, and hosts with **no** MCP Apps UI?                                                |
| **Progressive enhancement**     | If UI is absent or broken, does the same tool still return useful JSON/text?                                           |
| **Secret safety**               | Can a careless tool or iframe expose `.env` values into chat or logs?                                                  |
| **Maintenance tax**             | Extra packages, UI bundles, host-specific bugs, dual docs stories?                                                     |
| **Teachability**                | One install path on `/docs/guides/ai`, or a maze of “plugin vs MCP vs app”?                                            |
| **Footguns**                    | Easy `--force`, mutate-schema-from-chat, or “agent rewrote env.ts wrong”?                                              |
| **Differentiation**             | Does UI/tools show something ArkEnv uniquely owns (boundaries, prefixes, audit), or a generic env form?                |

---

## The hat

### Layer A — Job depth

| #  | Option                                                                           | Notes                                                |
| -- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| A1 | Scaffold only (`init`)                                                           | Thin; audit left to greps.                           |
| A2 | Scaffold + audit (**current**)                                                   | Plugin MCP tools today.                              |
| A3 | A2 + schema inspect / `check` / `example` MCP tools                              | Wrap more CLI primitives; still text/JSON.           |
| A4 | Full lifecycle mutate (agent edits schema + syncs example + validates in a loop) | High power; high footgun.                            |
| A5 | Interactive schema/env product as the job (editor-first)                         | Reinterprets ArkEnv as a chat UI app.                |
| A6 | Docs/RAG MCP only (fetch md, no project tools)                                   | Useful but does not satisfy “use ArkEnv in my repo.” |
| A7 | Maintainer/ops dashboard in chat (npm stats, releases)                           | Adjacent to `apps/dash`; not the coding-agent job.   |

### Layer B — Host surface (primary story)

| #  | Option                                              | Notes                                                                             |
| -- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| B1 | Skill / prompts only                                | Exists; no structured tools.                                                      |
| B2 | Plain MCP tools server                              | Exists inside agent-plugin.                                                       |
| B3 | Coding-agent plugin bundle (skill + commands + MCP) | **Current public story** on `/docs/guides/ai`.                                    |
| B4 | MCP Apps UI (SEP-1865) on top of tools              | Progressive enhancement; host support uneven (e.g. project-scoped Cursor quirks). |
| B5 | Cursor rules / repo `AGENTS.md` snippets only       | Cheap; no tooling.                                                                |
| B6 | Remote / hosted MCP connector (HTTP + OAuth)        | “Productized” install; secrets and tenancy hard.                                  |
| B7 | Native IDE extension (VS Code/Cursor extension API) | Not MCP; high tax.                                                                |
| B8 | New “MCP App” package as the *only* story           | Reject-by-default: erases plugin/skill.                                           |

### Layer C — Package / runtime placement

| #  | Option                                                   | Notes                                                               |
| -- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| C1 | Status quo: `@arkenv/agent-plugin` stdio via `npx`       | Already published alpha.                                            |
| C2 | Deepen **same** package (more tools and/or UI resources) | One bin, one docs page.                                             |
| C3 | New package `@arkenv/mcp-app` (UI-focused)               | Split brain with agent-plugin.                                      |
| C4 | Move MCP into CLI package (`arkenv mcp`)                 | Couples publish cadence to CLI; plugin still needs skills/commands. |
| C5 | Embed server in `apps/www` / remote docs                 | Wrong trust boundary for project filesystem.                        |
| C6 | External repo                                            | Drift vs monorepo CI.                                               |

### Layer D — Presentation richness

| #  | Option                                                          | Notes                                                            |
| -- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| D1 | JSON/text tool results only (**current**)                       | Universal fallback.                                              |
| D2 | Audit results viewer (`ui://`) — table, severity, suggested fix | Best MCP Apps fit: structured diagnostics → UI.                  |
| D3 | Init wizard UI (preset / framework / force confirmation)        | Human consent for refusals; still must call CLI.                 |
| D4 | Schema playground / key matrix editor in chat                   | Attractive; overlaps docs playground; secret risk if env-backed. |
| D5 | Full product chrome (charts, dash, marketing) in iframe         | Wrong job for coding agents.                                     |

---

## Evaluation

### Layer A

**A1 Scaffold only** — Honest and small, but we already shipped audit because greps invent false confidence. Weak on agent reliability for migrations. Maintenance tax low; differentiation low.

**A2 Scaffold + audit (current)** — Matches the docs story. High honesty. Reliability wins on the two jobs agents actually botch (init flags, raw env reads). Secret-safe if audit reports keys/locations not values. Teachability already done. Differentiation is ArkEnv-specific rules (prefixes, client boundary, v0 ambient).

**A3 + inspect/check/example tools** — Improves reliability for “add a key / sync example / validate this env file” without a UI. Composes with CLI (ADR 0027 inspect). Slight maintenance tax (tool schemas + refusal mapping). Footgun risk if `example` mutates files without clear consent — mitigate with same JSON settlement / nextActions pattern as init. Strong candidate to deepen **before** any iframe.

**A4 Full mutate lifecycle** — Max agent power, max footguns (`--force` loops, bad schema rewrites). Secret safety and teachability suffer. Score low until A3 tools are boring and safe.

**A5 Editor-first product** — Solves a different problem (interactive config product). Host coverage and maintenance tax explode. Conflicts with code-first ArkEnv identity unless framed as optional review UI (then it becomes D4, not A5).

**A6 Docs/RAG only** — Good complement, bad primary. Agents still hand-write `env.ts`. Low differentiation vs “fetch arkenv.js.org/\*.md” which docs already support.

**A7 Maintainer dash in chat** — Out of scope for the coding-agent ask; keep in `apps/dash`.

### Layer B

**B1 Skill only** — Necessary but insufficient; agents still skip CLI. Keep as fallback when plugins unavailable (docs already say this).

**B2 Plain MCP tools** — Necessary engine. Alone, discovery is worse than a plugin marketplace entry.

**B3 Plugin bundle** — Best teachability and host coverage for “install once.” Already S-tier for the *primary* story. Do not replace with “we launched an MCP App.”

**B4 MCP Apps UI** — Real SEP-1865 capability; Cursor documents Apps support with text fallback. Improves human review of audit/init, not agent autonomy. Maintenance tax + host quirks (project vs global MCP config). **A-tier tuck-away**, not a blocker. Never B8.

**B5 Rules only** — Free and weak. Score as C/D for the whole problem.

**B6 Remote MCP** — Attractive for “one-click connector,” terrible for reading local repos and `.env` without a trust model. Secret safety fails closed → don’t. Revisit only for docs/RAG (A6), not project tools.

**B7 IDE extension** — High tax, vendor-specific. Dominated by B3+B2 for this product.

**B8 MCP App as only story** — Fails honesty, host coverage, teachability. Keep in hat so it stays explicitly rejected.

### Layer C

**C1 Status quo** — Fine baseline; does not grow A3/D2.

**C2 Deepen agent-plugin** — Wins honesty, teachability, maintenance. One `npx` bin, one reference page. Natural home for optional `ui://` resources later.

**C3 New mcp-app package** — Only justified if UI bundle size/deps poison the plugin. Until then, split brain. C/D.

**C4 MCP inside CLI** — Plausible long-term (`arkenv` already owns agent JSON). Costs: CLI weight, plugin still needs a thin MCP entry or duplicated bin. B-tier alternate packaging, not required to close “MCP app” talk.

**C5 / C6** — Reject for project-local jobs (trust + drift).

### Layer D

**D1 JSON only** — Required forever as fallback. S for “ship now.”

**D2 Audit viewer** — Best MCP Apps ROI: diagnostics are already structured (`file`, `line`, `ruleId`, `suggestedFix`). UI is sugar; tool stays authoritative. Secret-safe if it never loads `.env` contents. A-tier.

**D3 Init wizard** — Helps humans confirm `--force` / presets; agents still prefer JSON tools. A/B-tier after D2.

**D4 Schema playground** — High wow, high overlap with docs, easy secret footgun if bound to live env. C unless scoped to schema-only (no values).

**D5 Product chrome** — D/E. Wrong audience.

---

## Tier list

Solutions ranked as **answers to the whole problem** (stacks).

### S (chosen / default story)

- **A2 + B3 + C2 + D1** — Keep saying: install the **coding-agent plugin**; it brings skill + commands + MCP `init`/`audit`. Treat “MCP app” requests as either (a) “use what we already shipped,” or (b) “deepen that package,” not “greenfield SEP-1865 product.”

### A (optional tuck-away — do not block on these)

- **A3 on C2** — Add MCP tools for `check` / `example` / schema inspect, reusing CLI JSON envelopes.
- **B4 + D2 on C2** — Progressive MCP App UI for **audit** results (and maybe init refusal/nextActions). Same tools; `ui://` when the host supports Apps.
- **B2 documented fallback** — Already partially done; keep for hosts without plugin marketplaces.

### B

- **A2 + B2 + C1 + D1** — MCP-only install path without plugin (acceptable secondary).
- **C4** — Fold MCP into CLI bin later if packaging pain appears.
- **D3** — Init consent UI after D2 proves useful.

### C

- **A6** as a separate tiny docs MCP (or just rely on `.md` routes).
- **A4** mutate-loops without stronger settlement/guardrails.
- **D4** schema playground in chat.
- **B5** rules-only as the plan.

### D

- **A5** editor-first “MCP app product.”
- **B6** remote project MCP.
- **B7** native IDE extension for this job.
- **C3** separate `@arkenv/mcp-app` without a hard packaging reason.
- **B8** replace plugin story with “MCP App.”

### E

- **A7 / D5** dash-in-chat / marketing chrome.

---

## S and A usage

### Use case 1: Greenfield “add ArkEnv”

**S:**

```text
User: Add ArkEnv to this repo.
Host has @arkenv/agent-plugin installed.
Agent: calls MCP tool `init` (cwd=project) → arkenv init --agent
       parses JSON settlement; on CLI.GIT_TREE_DIRTY follows nextActions
       (no preemptive --force).
Skill context: import { env } from "./env"; no runtimeEnv map.
```

**A (B4/D3 later):**

```text
Same `init` tool call.
Host that supports MCP Apps may show a small wizard:
  detected framework, preset, refusal reason, [Run with --force].
Tool JSON remains the source of truth if the iframe never mounts.
```

### Use case 2: “We’re leaking DATABASE_URL on the client”

**S:**

```text
Agent: calls MCP tool `audit`.
Gets diagnostics[] with file/line/ruleId/suggestedFix.
Edits imports to use env from ./env; respects public prefix rules.
Re-runs audit until clean (or reports remaining issues).
```

**A (B4/D2):**

```text
Same `audit` tool.
Host renders ui://arkenv/audit-results — sortable table, click opens file.
No .env values in the UI; keys and code locations only.
```

### Use case 3: Host with no plugin marketplace

**S:**

```text
User adds stdio MCP from docs:
  npx -y @arkenv/agent-plugin@alpha
Plus optional: npx skills add yamcodes/arkenv
Same init/audit tools; slash commands unavailable.
```

**A:**

```text
Unchanged. MCP Apps UI still works if the host supports Apps on that server.
```

### Use case 4: “We need an MCP app” in a planning meeting

**S:**

```text
Reframe: which Layer A job is missing?
If A2 is enough → demo plugin + MCP tools; close the thread.
If humans want richer review → schedule A-tier D2, do not rename the product.
If agents need check/example → schedule A3 tools first (usually higher ROI than UI).
```

**A:**

```text
Spike: one ui:// resource on audit in agent-plugin; verify Cursor + Claude fallback.
Ship only if demo beats JSON readability for real diagnostics volume.
```

---

## Current lean

**Ship / say now (S):** The answer to “we need an MCP app” is usually **we already have an agent plugin with an MCP server**. Public story stays B3; engine stays B2; package stays C2; presentation stays D1.

**Next deepenings if the pain is real (A, in order):**

1. **A3** — more CLI-backed MCP tools (`check`, `example`, inspect) with the same settlement discipline as `init`.
2. **D2 + B4** — audit results as an MCP App UI, progressive enhancement only. Implement with the internalized [add-app-to-server](../../skills/add-app-to-server/SKILL.md) + [create-mcp-app](../../skills/create-mcp-app/SKILL.md) skills from [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps) (not `convert-web-app` / `migrate-oai-app`).
3. Revisit **C4** only if distributing two bins (CLI + agent-plugin) becomes the actual pain.

**Do not:** greenfield a separate MCP App package, remote project connector, or editor-first chat product to satisfy the phrase “MCP app.”

---

## Changelog of this note

- 2026-09-18: First write-up (layers, metrics, hat, tier list). Grounded in existing `@arkenv/agent-plugin` + SEP-1865 MCP Apps distinction.
- 2026-09-18: Installed `add-app-to-server` + `create-mcp-app` into `skills/` for A-tier B4/D2 work; pointed Current lean at those skills.
