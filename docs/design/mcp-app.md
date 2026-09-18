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

## Competitors (category check)

### Envin — has Live Preview (browser, not MCP)

[Envin](https://envin.turbostarter.dev/docs/live-preview) ships the closest product analogue: `@envin/cli dev` starts a **local web server** (default `http://localhost:3000`) that:

- Lists variables from the schema + loaded `.env*` stack
- Shows **current values** and validation status
- Filters (`all` / `invalid` / `valid`) and search
- Switches **Development vs Production** env-file precedence
- Copies “effective” vars for hosting dashboards
- Docs also describe edit / generate flows around those files

It is **not** an MCP App. The human leaves the agent/IDE chat for a separate browser tab. No SEP-1865 `ui://` View.

**Implication:** E1 is validated as a category feature (not an invention). Our differentiation is **where** the board lives: **inline in the MCP host** (agent-native), backed by the same structured payload agents already consume — not a second `localhost:3000` process as the S story.

### Varlock — no Live Preview GUI; strong agent-safe load

[Varlock](https://varlock.dev) does **not** appear to ship an env-health web UI or MCP App board.

What it does have that rhymes with our data plane:

- `varlock load` — human-readable per-key validation summary in the terminal
- `varlock load --agent --format json-full` — machine-readable graph with per-item validation/sensitivity; **redacts** `@sensitive` values for agents
- MCP docs are about **injecting secrets into other MCP servers** + a **docs** MCP — not an env preview View

**Implication:** steal the **agent-redaction / json-full discipline** (reinforces S2 + D4), not a GUI to copy. Varlock does not undercut E1; it undercuts “we need a fancy secret orchestrator UI.”

### Score impact

| Claim | After Envin / Varlock |
| ----- | --------------------- |
| E1 Live Preview as S | **Holds** — Envin proves demand; we win on MCP-native placement |
| Clone Envin’s standalone browser CLI as the MCP App | **No** — different product surface; optional A-tier later sharing D4 |
| Show raw values like Envin by default | **No for v1 App** — agent chat is a worse secret sink than a local tab; keep S2, optional S3 |
| Audit-only App as primary | Still weaker — Envin’s board is env-health, not AST hygiene |
| Invent status outside CLI | Still reject — Varlock’s load graph is the right “one truth” shape |

---

## ORM analogy (Prisma / Drizzle)

Env validation and ORMs share a shape: **author a schema → get a Typesafe runtime surface → inspect the resolved world when something is wrong.** Studio/preview is about the *resolved instance*, not about re-authoring the schema DSL as the main UX.

### Prisma

Two separate products, both relevant:

1. **[Prisma Studio](https://www.prisma.io/docs/orm/v6/tools/prisma-studio)** — local (and [embeddable](https://www.prisma.io/docs/studio/integrations/embedding)) visual browser of the **resolved database world** (tables, rows, filters). Prisma 7 Studio introspects the DB directly; humans leave the editor for a visual surface. Optional AI hooks on embed (`llm`) assist filtering/SQL — View first, model assist second.
2. **[Prisma MCP](https://www.prisma.io/docs/ai/tools/mcp-server)** — remote MCP **tools** for Prisma Postgres (list DBs, introspect schema, run SQL, schema update) plus **docs search**. Text/JSON for agents. Destructive CLI paths get explicit **AI consent guardrails** (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`).

Prisma does **not** (today) appear to ship Studio itself as a SEP-1865 MCP App. Pattern = **Studio for humans + MCP tools for agents**, with strong mutate guardrails.

### Drizzle

1. **Drizzle Studio** — same category as Prisma Studio / Envin Live Preview: localhost visual over the resolved DB.
2. Official **“Drizzle Studio MCP”** is still an [open request](https://github.com/drizzle-team/drizzle-orm/issues/4656) (“what Studio shows, but for agents”). Community MCP servers fill gaps with introspect/query tools.
3. **[Drizzle Cube MCP App](https://www.drizzle-cube.dev/ai/mcp-app/)** (analytics adjacent, not core ORM) is a real SEP-1865 example: `chart` tool returns an interactive View in chat; `load` stays JSON for text-only hosts; App is **opt-in progressive enhancement**.

### Mapping onto ArkEnv

| ORM / env pattern | ArkEnv analogue |
| ----------------- | --------------- |
| `schema.prisma` / `schema.ts` | `env.ts` (`arkenv({…})`) |
| Migrated DB / query client | Validated `env` object + loaded `.env*` |
| Studio (browse resolved rows/tables) | **E1 Live Preview** (browse resolved keys/status) |
| Studio edits *data*, migrate edits *schema* | Preview/check ≠ rewrite `env.ts`; init/example are separate tools |
| Prisma MCP tools (introspect, query) | `preview` / `check` / `audit` / `init` JSON tools |
| Drizzle Cube MCP App on `chart` | MCP App on `preview` |
| Prisma AI mutate consent | Keep **I4** behind refusals / explicit consent (never default) |
| Embeddable Studio + optional AI | A-tier: App nudges model (**I3**), not the other way around for v1 |

### Score impact (ORM pass)

| Claim | After Prisma / Drizzle |
| ----- | ---------------------- |
| E1 as S | **Strengthened** — “Studio for the resolved schema world” is the category pattern |
| MCP App (not only Studio tab) as S ship | **Strengthened** — ORMs still mostly split Studio↔MCP; Drizzle Cube shows App-on-tool; we can ship Studio-*in-chat* as the leap |
| E4 schema editor as primary App | **Weakened** — Studios browse/edit *instances*; schema changes stay migrate/CLI/agent-code |
| I4 hard mutate from iframe | **Weakened** — Prisma invests in AI mutate guardrails; we stay I2/I3 first |
| P6 localhost preview | Still A-tier Envin/Studio parity, not a substitute for the App |
| Docs-only MCP | Prisma has it as *one* tool among many — never the whole product |

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

| # | Option | Notes |
| - | ------ | ----- |
| E1 | **Live Preview / env health board** | Rows = schema keys; columns ≈ declared / present in example / validates / fail reason; optional boundary (server vs public). Envin-class UX, MCP-hosted. |
| E2 | Audit findings viewer | Table of AST diagnostics (`unvalidated-access`, `secret-leak`, …). Strong, but code-hygiene not env-health. |
| E3 | Init / setup wizard | Preset, framework, refusal/`--force` consent. One-shot onboarding, not ongoing product. |
| E4 | Schema playground / editor in chat | Edit `env.ts` visually. Overlaps docs; high mutate footgun. |
| E5 | Migrate assistant UI | Before/after `process.env` → `env.*` checklist. Narrow job; great later companion. |
| E6 | Combined cockpit (E1+E2+E3 in one iframe) | Best eventual story; too wide for first ship. |
| E7 | Pitch / demo App (homepage snippets in chat) | Marketing, not project truth. |
| E8 | Maintainer dash (npm/GitHub) in chat | `apps/dash` job; wrong audience. |
| E9 | Envin clone: only `arkenv preview` → localhost browser | Same board UX, **not** an MCP App. Useful parity later; does not satisfy the closed App decision. |

### Layer D — Data plane

| # | Option | Notes |
| - | ------ | ----- |
| D1 | Audit report only | Powers E2; cannot truthfully drive E1 fail-why for values. |
| D2 | `check` JSON only | Fail reasons for loaded env; weak on “declared but unused / not in example.” |
| D3 | Schema inspect only | Keys + types; no runtime pass/fail. |
| D4 | **Compose: inspect + `check` (+ example presence)** | Natural Live Preview payload. New `preview`/`status` tool. Shape inspiration: Varlock `load --agent --format json-full` (redacted per-item graph). |
| D5 | Live `process.env` / dotenv watch (polling) | “Live” literally; Envin watches files via its CLI server. Higher tax + secret risk in chat. |
| D6 | Homegrown status model in the App | Forbidden — drifts from CLI. |

### Layer I — Interaction depth

| #  | Option                                                        | Notes                                                    |
| -- | ------------------------------------------------------------- | -------------------------------------------------------- |
| I1 | Display-only (tool result → UI)                               | Simplest SEP-1865 pattern; host calls tool, View paints. |
| I2 | Display + UI-triggered refresh/recheck                        | View calls same tool(s) again; still read-mostly.        |
| I3 | + guided actions (copy fix prompt, “ask agent to fix key X”)  | `updateModelContext` / `sendMessage`; soft mutate.       |
| I4 | + hard mutate (write schema, run `init --force`, edit `.env`) | Powerful; footgun-heavy for v1.                          |

### Layer P — Packaging

| # | Option | Notes |
| - | ------ | ----- |
| P1 | Status quo tools only (no App) | **Closed — rejected by product decision.** Kept so it cannot sneak back as S. |
| P2 | Deepen `@arkenv/agent-plugin` (`registerAppTool` / `registerAppResource`) | Default; matches add-app-to-server. |
| P3 | New `@arkenv/mcp-app` package | Only if UI/vite-singlefile deps poison the plugin. |
| P4 | App shell in CLI (`arkenv mcp`) | Optional later packaging; not required for experience choice. |
| P5 | Remote HTTP MCP App | Wrong trust boundary for local `.env` / `env.ts`. |
| P6 | Standalone `arkenv preview` HTTP (Envin-style) sharing D4 | A-tier **parity** with Envin for humans outside chat; must reuse the same compose payload as the MCP App, not a second status engine. |

### Layer S — Secret policy

| # | Option | Notes |
| - | ------ | ----- |
| S1 | Keys + status + messages only (never values) | Safest; matches audit today. |
| S2 | **Keys + status + redacted “was …” hints** | Matches CLI/error voice + Varlock `--agent` redaction; enough for “why” in chat. |
| S3 | Opt-in reveal value (host consent / button) | Envin-like fullness for humans; don’t require for v1. |
| S4 | Show raw values by default | Envin’s local tab can afford this more than agent chat. Reject for MCP App default. |

---

## Evaluation

### Layer E

**E1 Live Preview** — Highest ArkEnv-shaped score: the product *is* “your `env` object is valid.” Glanceability is the point. Complements agents (human sees board, model gets structured rows). Needs D4 truthfulness. Ship slice is a single board + one tool. Differentiation vs Envin/Prisma Studio/Drizzle Studio: **MCP-hosted Studio**, not a side browser. Differentiation vs Varlock: **interactive View**, not only terminal/`load` JSON. ORM analogy: Studio for the resolved world.

**E2 Audit viewer** — Excellent second App, weaker primary: answers “is the codebase using ArkEnv correctly?” not “is this environment valid?” Cheap to build (data already structured). Should not win the *name* of the ArkEnv MCP App experience.

**E3 Init wizard** — High value at minute zero, then idle. Ship as A-tier companion or fold a “not initialized” empty state into E1, not as the whole product.

**E4 Schema editor** — Fights code-first identity; footguns and maintenance tax high. ORM Studios don’t make “edit schema.prisma in an iframe” the primary product either. C/D as primary.

**E5 Migrate assistant** — Great narrative for migrations; narrower than env health. A/B after E1.

**E6 Combined cockpit** — Correct long-term north star; fails ship slice for v1. Rank as destination, not first commit.

**E7 / E8** — Wrong jobs (marketing / maintainer). D/E.

**E9 Envin-only localhost preview** — Satisfies human glanceability, **fails** the closed “ship an MCP App” decision if it is the only ship. Keep as P6/A once D4 exists.

### Layer D

**D1** — Insufficient for E1. Fine for E2.

**D2 / D3** alone — Incomplete Live Preview.

**D4** — Required for honest E1. Reuse inspect + `check` envelopes; add a thin compose tool (`preview` / `status`) rather than D6. Mimic Varlock’s per-item graph + agent redaction, not Envin’s “show the secret in the browser” default.

**D5** — Literal “Live” via polling ([ext-apps polling pattern](https://github.com/modelcontextprotocol/ext-apps)); Envin gets this “for free” via its file-watching CLI server. A-tier after a solid on-demand board. Secret + tax.

**D6** — Reject on truthfulness.

### Layer I

**I1** — Enough for a first demo; weak once users expect a Refresh button.

**I2** — Best v1: still read-mostly, feels interactive, low footgun.

**I3** — Strong A-tier (“Fix DATABASE_URL” → nudge model).

**I4** — Defer; same discipline as CLI refusals/`nextActions` and Prisma’s AI destructive-action consent if ever added.

### Layer P

**P1** — Explicitly rejected (closed decision).

**P2** — Wins honesty, teachability, one install path. Use add-app-to-server on existing `init`/`audit` server; add preview tool + `ui://` resource.

**P3** — Park until bundle pain is measured.

**P4 / P5** — Not the experience decision.

**P6** — Envin / Prisma Studio / Drizzle Studio parity for non-chat workflows. Only after D4 is stable; same payload as the App. Do not let P6 replace the MCP App as the announced product (that would recreate the ORM split instead of leaping to Studio-in-chat).

### Layer S

**S1** — Safe but weaker “why” for type failures.

**S2** — Matches ArkEnv error voice + Varlock `--agent`. Enough why without raw secrets. **Default for MCP App.**

**S3** — Optional later (Envin-like reveal for humans who explicitly opt in).

**S4** — Reject as MCP App default (chat is a worse sink than Envin’s local tab).

---

## Tier list

### S (chosen / default story)

- **E1 + D4 + I2 + P2 + S2** — Ship the ArkEnv MCP App as a **Live Preview env health board** (Studio-for-`env`) inside `@arkenv/agent-plugin`: one compose tool (inspect + `check` + example presence) returns structured rows; a `ui://` View renders them; Refresh re-calls the tool; values redacted like CLI / Varlock `--agent`; JSON fallback identical payload (Drizzle Cube–style progressive enhancement).

### A (optional — do not block v1 App on these)

- **E2** as a second App resource on `audit` (code hygiene panel).
- **I3** “Ask agent to fix this key” from a row.
- **D5** polling / watch for true live updates (Envin-like freshness).
- **E3** empty-state / first-run wizard when no `env.ts`.
- **E6** cockpit merge once E1+E2 are boring.
- **P6 / E9** standalone `arkenv preview` browser sharing D4 (Envin / Studio parity outside chat).
- UX sugar Envin/Studio already teaches: invalid/valid filters, search, env-file mode (dev vs prod stacks) — once the board exists.
- **S3** opt-in reveal.
- Prisma-like **mutate consent** copy if any I4 path ever ships.

### B

- **E5** migrate assistant App.
- **P3** split package if plugin weight hurts.

### C

- **E4** schema editor as primary experience.
- **I4** hard mutate from the iframe as default UX.
- **D2 or D3 alone** powering a “preview” that lies by omission.
- **E9 / P6 alone** (localhost Envin clone) as the answer to “ship an MCP App.”

### D

- **E7** pitch App / **E8** dash-in-chat as the ArkEnv MCP App.
- **D6** App-owned status model.
- **S4** raw values by default in the MCP App.
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

**Ship the App as Live Preview (E1), not as “audit table with a logo,” and not as an Envin localhost clone.**

Envin/Varlock/ORM check: **plan holds and is stronger.** Envin + Prisma/Drizzle Studio confirm the board UX (inspect the resolved schema world). Varlock confirms agent-redacted graphs. ORMs still mostly split Studio↔MCP tools; Drizzle Cube shows App-on-tool. We ship **Studio-in-chat** as S.

Implementation order inside P2:

1. Compose tool **D4** (`preview`/`status`) reusing inspect + `check` (+ example presence) — JSON first (Varlock `load --agent` / Prisma introspect energy) so hosts without UI still win.
2. MCP App View via add-app-to-server / create-mcp-app (`ui://arkenv/live-preview`), **I2** refresh, **S2** redaction (Drizzle Cube progressive enhancement).
3. A-tier: filters/search (Envin/Studio), **E2** audit App, **I3** row actions, polling, wizard/cockpit, optional **P6** standalone preview sharing the same payload.

**Do not:** treat existing tools-without-UI as the product; invent status outside CLI truth; show raw secrets in chat by default; make a chat schema IDE the v1 App; ship only `localhost:3000` and call it the MCP App; treat docs MCP as the whole product (Prisma’s trap if you stop at `search_*_documentation`).

---

## Changelog of this note

- 2026-09-18: First write-up (misread ask as “whether MCP App”).
- 2026-09-18: Installed `add-app-to-server` + `create-mcp-app` into `skills/`.
- 2026-09-18: **Correction** — MCP App is decided. Reframed hat around experience (Live Preview vs rivals); new lean **E1 + D4 + I2 + P2 + S2**. Prior “tools are enough” story marked closed/rejected as product answer.
- 2026-09-18: Competitor pass — **Envin** has localhost Live Preview (validates E1; not MCP). **Varlock** has agent-safe `load` JSON, no preview GUI/MCP App. Lean unchanged; added E9/P6 as A-tier Envin parity, borrowed filters/search/redaction notes.
- 2026-09-18: ORM pass — **Prisma Studio + MCP** (split surfaces, mutate guardrails) and **Drizzle Studio + Cube MCP App** (Studio category + real App-on-tool). Lean unchanged; frame E1 as Studio-for-`env`, S as Studio-in-chat leap.
