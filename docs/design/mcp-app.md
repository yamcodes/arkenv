# ArkEnv MCP App experience

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note for [#1862](https://github.com/yamcodes/arkenv/pull/1862). **Chosen public story:** lean **E1 + D4 + I2 + P2 + S2** (Live Preview env health board on `@arkenv/agent-plugin`, JSON fallback, keys + fail-why, redacted values).

---

## Correction (do not re-open)

An earlier draft of this note treated “ship an MCP App?” as open and scored “just use the existing plugin/MCP tools” as S. **That misread the ask.**

**Closed:**

- We **will** ship a real [MCP App](https://modelcontextprotocol.io/extensions/apps/overview) (SEP-1865: `ui://` HTML View linked from tool `_meta.ui.resourceUri`).
- Existing `@arkenv/agent-plugin` MCP tools (`init`, `audit`), the skill, and the plugin remain the install/discovery story — they are **substrate**, not a substitute for the App.
- Progressive enhancement still applies: the same tool must return useful JSON/text when the host cannot render UI.

**Open (this note):** what **product experience** the MCP App should be — e.g. a Live Preview–style env health GUI vs rivals — and how that experience is packaged inside ArkEnv.

---

## Problem

When we are done, a user (or agent) in a project with ArkEnv can open an **inline interactive View** in an MCP Apps–capable host that makes the project’s environment story legible: what keys exist in the schema, what looks hooked up, what is missing or failing, and **why** — without dumping secrets into chat.

Constraints:

1. Experience must be an MCP App View (tool + `ui://` resource), not docs marketing copy and not “JSON in a prettier font.”
2. Must deepen the local project story (filesystem + schema + env files), not a remote SaaS connector.
3. Must not become a second source of truth that drifts from CLI `check` / schema inspect / `audit`.
4. Secret policy is explicit: prefer keys + status + failure reasons; values redacted or opt-in.
5. Implement with [add-app-to-server](../../skills/add-app-to-server/SKILL.md) + [create-mcp-app](../../skills/create-mcp-app/SKILL.md) on the existing server unless packaging forces a split.

Baseline substrate (already shipped):

| Surface                                        | Role relative to the App                      |
| ---------------------------------------------- | --------------------------------------------- |
| `arkenv init --agent` / `check` / inspect      | Data + mutations the App and tools wrap       |
| MCP `init` / `audit` in `@arkenv/agent-plugin` | Tools to keep / extend; App attaches to tools |
| Coding-agent plugin                            | How hosts install the server                  |

---

## Layer map

- **Layer E — Experience (what the App *is*):** the product concept users see. Substitutes.
- **Layer D — Data plane (what feeds the View):** schema / env / audit / live process. Composes with E.
- **Layer I — Interaction depth:** view-only vs UI-initiated tool calls vs mutate. Composes with E/D.
- **Layer P — Packaging:** where code and bundles live. Substitutes.
- **Layer S — Secret policy:** how values appear. Substitutes; every stack picks one.

Items on different layers compose. “Live Preview vs audit table” is Layer E. “Deepen agent-plugin vs new package” is Layer P. Do not flatten.

---

## Metrics

| Metric                    | Question                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **ArkEnv-shaped**         | Does the View show *typed env validation* (declared keys, fail-fast reasons, client/server boundary), or a generic “env manager”? |
| **Human glanceability**   | Can a human answer “what’s broken and why?” in one look without reading a JSON dump?                                              |
| **Agent complementarity** | Does the View help the human steer while the model still gets structured tool JSON to act on?                                     |
| **Truthfulness**          | Is every row backed by CLI/inspect/`check`/`audit` truth, or inventing a parallel status model?                                   |
| **Secret safety**         | Can the iframe leak `.env` values into chat, logs, or host memory by default?                                                     |
| **Ship slice**            | Can v1 ship without boiling the ocean (watch mode, full editor, remote auth)?                                                     |
| **Maintenance tax**       | UI bundle size, host quirks, dual docs, package split?                                                                            |
| **Footguns**              | Does the UI make dangerous writes (`--force`, rewrite schema) too easy?                                                           |

---

## The hat

### Layer E — Experience (primary product)

| #  | Option                                       | Notes                                                                                                                                       |
| -- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| E1 | **Live Preview / env health board**          | Rows = schema keys; columns ≈ declared / present in example / validates / fail reason; optional boundary (server vs public). User’s sketch. |
| E2 | Audit findings viewer                        | Table of AST diagnostics (`unvalidated-access`, `secret-leak`, …). Strong, but code-hygiene not env-health.                                 |
| E3 | Init / setup wizard                          | Preset, framework, refusal/`--force` consent. One-shot onboarding, not ongoing product.                                                     |
| E4 | Schema playground / editor in chat           | Edit `env.ts` visually. Overlaps docs; high mutate footgun.                                                                                 |
| E5 | Migrate assistant UI                         | Before/after `process.env` → `env.*` checklist. Narrow job; great later companion.                                                          |
| E6 | Combined cockpit (E1+E2+E3 in one iframe)    | Best eventual story; too wide for first ship.                                                                                               |
| E7 | Pitch / demo App (homepage snippets in chat) | Marketing, not project truth.                                                                                                               |
| E8 | Maintainer dash (npm/GitHub) in chat         | `apps/dash` job; wrong audience.                                                                                                            |

### Layer D — Data plane

| #  | Option                                              | Notes                                                                        |
| -- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| D1 | Audit report only                                   | Powers E2; cannot truthfully drive E1 fail-why for values.                   |
| D2 | `check` JSON only                                   | Fail reasons for loaded env; weak on “declared but unused / not in example.” |
| D3 | Schema inspect only                                 | Keys + types; no runtime pass/fail.                                          |
| D4 | **Compose: inspect + `check` (+ example presence)** | Natural Live Preview payload. New `preview`/`status` tool likely.            |
| D5 | Live `process.env` / dotenv watch (polling)         | “Live” literally; higher tax + secret risk.                                  |
| D6 | Homegrown status model in the App                   | Forbidden — drifts from CLI.                                                 |

### Layer I — Interaction depth

| #  | Option                                                        | Notes                                                    |
| -- | ------------------------------------------------------------- | -------------------------------------------------------- |
| I1 | Display-only (tool result → UI)                               | Simplest SEP-1865 pattern; host calls tool, View paints. |
| I2 | Display + UI-triggered refresh/recheck                        | View calls same tool(s) again; still read-mostly.        |
| I3 | + guided actions (copy fix prompt, “ask agent to fix key X”)  | `updateModelContext` / `sendMessage`; soft mutate.       |
| I4 | + hard mutate (write schema, run `init --force`, edit `.env`) | Powerful; footgun-heavy for v1.                          |

### Layer P — Packaging

| #  | Option                                                                    | Notes                                                                         |
| -- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| P1 | Status quo tools only (no App)                                            | **Closed — rejected by product decision.** Kept so it cannot sneak back as S. |
| P2 | Deepen `@arkenv/agent-plugin` (`registerAppTool` / `registerAppResource`) | Default; matches add-app-to-server.                                           |
| P3 | New `@arkenv/mcp-app` package                                             | Only if UI/vite-singlefile deps poison the plugin.                            |
| P4 | App shell in CLI (`arkenv mcp`)                                           | Optional later packaging; not required for experience choice.                 |
| P5 | Remote HTTP MCP App                                                       | Wrong trust boundary for local `.env` / `env.ts`.                             |

### Layer S — Secret policy

| #  | Option                                       | Notes                                                                         |
| -- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| S1 | Keys + status + messages only (never values) | Safest; matches audit today.                                                  |
| S2 | **Keys + status + redacted “was …” hints**   | Matches CLI/error voice (`was [REDACTED]`, `was a string`); enough for “why.” |
| S3 | Opt-in reveal value (host consent / button)  | Nice later; don’t require for v1.                                             |
| S4 | Show raw values by default                   | Reject.                                                                       |

---

## Evaluation

### Layer E

**E1 Live Preview** — Highest ArkEnv-shaped score: the product *is* “your `env` object is valid.” Glanceability is the point. Complements agents (human sees board, model gets structured rows). Needs D4 truthfulness. Ship slice is a single board + one tool. Differentiation vs generic MCP toys is clear.

**E2 Audit viewer** — Excellent second App, weaker primary: answers “is the codebase using ArkEnv correctly?” not “is this environment valid?” Cheap to build (data already structured). Should not win the *name* of the ArkEnv MCP App experience.

**E3 Init wizard** — High value at minute zero, then idle. Ship as A-tier companion or fold a “not initialized” empty state into E1, not as the whole product.

**E4 Schema editor** — Fights code-first identity; footguns and maintenance tax high. C/D as primary.

**E5 Migrate assistant** — Great narrative for migrations; narrower than env health. A/B after E1.

**E6 Combined cockpit** — Correct long-term north star; fails ship slice for v1. Rank as destination, not first commit.

**E7 / E8** — Wrong jobs (marketing / maintainer). D/E.

### Layer D

**D1** — Insufficient for E1. Fine for E2.

**D2 / D3** alone — Incomplete Live Preview.

**D4** — Required for honest E1. Reuse inspect + `check` envelopes; add a thin compose tool (`preview` / `status`) rather than D6.

**D5** — Literal “Live” via polling ([ext-apps polling pattern](https://github.com/modelcontextprotocol/ext-apps)); A-tier after a solid on-demand board. Secret + tax.

**D6** — Reject on truthfulness.

### Layer I

**I1** — Enough for a first demo; weak once users expect a Refresh button.

**I2** — Best v1: still read-mostly, feels interactive, low footgun.

**I3** — Strong A-tier (“Fix DATABASE_URL” → nudge model).

**I4** — Defer; same discipline as CLI refusals/`nextActions` if ever added.

### Layer P

**P1** — Explicitly rejected (closed decision).

**P2** — Wins honesty, teachability, one install path. Use add-app-to-server on existing `init`/`audit` server; add preview tool + `ui://` resource.

**P3** — Park until bundle pain is measured.

**P4 / P5** — Not the experience decision.

### Layer S

**S1** — Safe but weaker “why” for type failures.

**S2** — Matches ArkEnv error voice; enough why without raw secrets. **Default.**

**S3** — Optional later.

**S4** — Reject.

---

## Tier list

### S (chosen / default story)

- **E1 + D4 + I2 + P2 + S2** — Ship the ArkEnv MCP App as a **Live Preview env health board** inside `@arkenv/agent-plugin`: one compose tool (inspect + `check` + example presence) returns structured rows; a `ui://` View renders them; Refresh re-calls the tool; values redacted like CLI; JSON fallback identical payload.

### A (optional — do not block v1 App on these)

- **E2** as a second App resource on `audit` (code hygiene panel).
- **I3** “Ask agent to fix this key” from a row.
- **D5** polling / watch for true live updates.
- **E3** empty-state / first-run wizard when no `env.ts`.
- **E6** cockpit merge once E1+E2 are boring.

### B

- **E5** migrate assistant App.
- **P3** split package if plugin weight hurts.
- **S3** opt-in reveal.

### C

- **E4** schema editor as primary experience.
- **I4** hard mutate from the iframe as default UX.
- **D2 or D3 alone** powering a “preview” that lies by omission.

### D

- **E7** pitch App / **E8** dash-in-chat as the ArkEnv MCP App.
- **D6** App-owned status model.
- **S4** raw values by default.
- **P1** “no App, tools are enough” (re-opened by mistake).

### E

- Remote project MCP App (P5) as the product.

---

## S and A usage

### Use case 1: “What’s wrong with my env?”

**S:**

```text
User: Show me my ArkEnv status.
Agent/host: calls tool `preview` (or `status`) on @arkenv/agent-plugin.
Host renders ui://arkenv/live-preview.
Board:
  DATABASE_URL  server  example✓  check✗  must be a URL string (was [REDACTED])
  PORT          server  example✓  check✓  ok
  NEXT_PUBLIC_… public  example✗  check—  missing from .env.example
User hits Refresh → tool runs again.
Model also receives the same rows as JSON to propose fixes.
```

**A (E2):**

```text
User: Are we still reading process.env?
Agent: calls `audit` → ui://arkenv/audit-findings table.
```

### Use case 2: Greenfield, no schema yet

**S:**

```text
preview tool returns empty/uninitialized.
Live Preview empty state: “No env.ts — run init” (CTA may be text; hard mutate stays I4/A).
Agent still uses existing `init` tool for scaffolding.
```

**A (E3):**

```text
Same empty state upgrades to a small init wizard View.
```

### Use case 3: Host without MCP Apps UI

**S:**

```text
Same `preview` tool; host shows JSON rows.
No iframe; agent narrates failures from structured data.
```

### Use case 4: “Make it feel live”

**S (v1):** on-demand Refresh (I2).

**A:** D5 polling while the View is open; tear down on `onteardown`.

---

## Current lean

**Ship the App as Live Preview (E1), not as “audit table with a logo.”**

Implementation order inside P2:

1. Compose tool **D4** (`preview`/`status`) reusing inspect + `check` (+ example presence) — JSON first so hosts without UI still win.
2. MCP App View via add-app-to-server / create-mcp-app (`ui://arkenv/live-preview`), **I2** refresh, **S2** redaction.
3. A-tier: **E2** audit App, then **I3** row actions, then polling / wizard / cockpit.

**Do not:** treat existing tools-without-UI as the product; invent status outside CLI truth; show raw secrets; make a chat schema IDE the v1 App.

---

## Changelog of this note

- 2026-09-18: First write-up (misread ask as “whether MCP App”).
- 2026-09-18: Installed `add-app-to-server` + `create-mcp-app` into `skills/`.
- 2026-09-18: **Correction** — MCP App is decided. Reframed hat around experience (Live Preview vs rivals); new lean **E1 + D4 + I2 + P2 + S2**. Prior “tools are enough” story marked closed/rejected as product answer.
