# Schema loader mechanism

Living evaluation that was **promoted** to [ADR 0027](./adr/0027-cli-schema-inspection.md). Keep scoring new mechanism ideas here; do not fork a second decision.

**Status:** promoted for [#1314](https://github.com/yamcodes/arkenv/issues/1314) / PR [#1622](https://github.com/yamcodes/arkenv/pull/1622). **Chosen public story:** S stack (import; skip validation; record the argument to `arkenv()`; handshake via `globalThis`) — canonical text is the ADR.

Related: export-surface hat in [schema-capture-export-surface.md](./schema-capture-export-surface.md) (assumes this engine). Consumers: [#1234](https://github.com/yamcodes/arkenv/issues/1234) `sync`, [#962](https://github.com/yamcodes/arkenv/issues/962) `check`. [ADR 0013](./adr/0013-flat-layout-codegen-type-strategy.md) forbids schema-text parsing.

This note exists because #1314 blessed “import, don’t parse” and *named* a dry-run hook **or** an env stub, without scoring them. Recording was implemented, not hat-tested, until this file.

## Problem

When we are done, **one** CLI primitive can:

1. Load a user’s flat `env.ts` (`export const env = arkenv({ ... })`) without the author wrapping that call.
2. Return **declared keys**, **per-key schema**, and best-effort **defaults**, in declaration order — not a coerced `env` object.
3. Do that when `process.env` is empty or hostile (the CLI’s own env).
4. Work for ArkType DSL, compiled `type({...})`, Zod, Valibot, and other Standard Schema maps, without a per-validator parser.
5. Let `check` validate an **arbitrary** env dict (process + `--env-file`) with the **same** validation as runtime `arkenv()`, not a second engine.
6. Leave normal app boots unchanged.

“Simpler” that only yields `Object.keys` after a fake-successful boot does **not** satisfy (2) or (5).

## Layer map

- **Layer A — How the file gets into the process:** import vs parse vs subprocess vs don’t load. Substitutes.
- **Layer B — How eager `arkenv()` validation is survived:** skip-and-record vs stub env vs populate-and-boot vs catch vs don’t call `arkenv`. Substitutes. Only bites if Layer A executes the module.
- **Layer C — What we hand to `sync` / `check`:** raw definition vs validated keys vs error issues. Substitutes; constrained by B.
- **Layer D — Handshake when CLI `arkenv` ≠ user `arkenv`:** `globalThis` vs Jiti alias vs none. Substitutes. Only bites if B needs the user’s `arkenv()` to cooperate.

Items on different layers compose. “Just stub `process.env`” is B+C, not a full answer.

## Metrics

| Metric               | Question                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| Matches #1314        | Do we get keys + schema with an empty environment, all validators, no parse?    |
| Feeds `check`        | Can we validate a *chosen* env dict with the same `parse` as runtime?           |
| App `env.ts` tax     | Must authors change their schema file?                                          |
| Simplicity           | Moving parts in core, CLI, and the user’s process?                              |
| Honesty              | Do we pretend validation ran when it did not?                                   |
| Footguns             | Silent wrong keys, CLI env leaking into “valid”, module-scope `env.FOO` throws? |
| Validator neutrality | Zod / Valibot / compiled ArkType without CLI special cases?                     |
| Handshake / skew     | New CLI + old core: fail clearly, or silently do the wrong thing?               |
| ADR 0013             | Are we a mini schema compiler?                                                  |
| Maintenance hell     | Proxies, aliases, monkey-patches, dual validation engines?                      |

## The hat

### Layer A — Getting the file into the process

| #  | Option                                              | Notes                                                                                             |
| -- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A1 | In-process import (Jiti / bundle-require / tsx)     | Blessed on #1314. PR uses Jiti.                                                                   |
| A2 | Static parse of `env.ts` (AST / regex of ArkType)   | Rejected, [ADR 0013](./adr/0013-flat-layout-codegen-type-strategy.md). Stays so it cannot return. |
| A3 | Subprocess: generate a tiny inspector and `node` it | Import in another process; still needs a B.                                                       |
| A4 | Regex-scan `process.env.X` / `env.X` in the repo    | What the CLI already does for init. Not the schema.                                               |
| A5 | Author exports a second `schema` / `keys` constant  | App tax.                                                                                          |

### Layer B — Surviving `arkenv()` at import

| #   | Option                                                                | Notes                                                          |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| B1  | Skip validation; **record** the `def` argument                        | Current PR. Global capture flag.                               |
| B2  | Stub / fill `process.env` so validation **succeeds**                  | Named on #1314. “Simpler.”                                     |
| B3  | Populate from `--env-file` / real env and **boot**                    | Natural `check`. Fails empty-env `sync`.                       |
| B4  | Import, **catch** `ArkEnvError`, scrape issue paths                   | Keys maybe; no schema objects; misses defaults that never ran. |
| B5  | `arkenv(def, { dryRun: true })`                                       | CLI cannot change the user’s call.                             |
| B6  | Public `collectKeys(def)` instead of `arkenv`                         | Same: user’s file still calls `arkenv`.                        |
| B7  | Monkey-patch / wrap `arkenv` in Jiti before eval                      | Fragile; still a skip/record in a costume.                     |
| B8  | Always stash `def` on the returned object / a WeakMap **after** parse | Still requires parse to succeed.                               |
| B9  | Return a Proxy env                                                    | Tried; broke Jiti. Record still happened.                      |
| B10 | Authors wrap `begin`/`end` in `env.ts`                                | Rejected product (export-surface hat A4).                      |

### Layer C — Result shape

| #  | Option                                            | Notes                                                |
| -- | ------------------------------------------------- | ---------------------------------------------------- |
| C1 | Recorded `def` → `declaredKeysFromDefinitions`    | Keys, per-key schema, best-effort `hasDefault`.      |
| C2 | `Object.keys` / `getSchemaKeys` on a booted `env` | Values, not schema. Defaults look like present keys. |
| C3 | Paths from a thrown `ArkEnvError`                 | Incomplete; no happy-path keys.                      |
| C4 | `getSchemaKeys` only (compiled ArkType JSON)      | Misses Zod/Valibot maps and raw DSL objects.         |

### Layer D — Handshake

| #  | Option                                          | Notes                                                         |
| -- | ----------------------------------------------- | ------------------------------------------------------------- |
| D1 | `globalThis` capture bag                        | Current. CLI sets flag; user’s `arkenv()` reads it.           |
| D2 | Jiti alias `@arkenv/core` to CLI/workspace copy | Tests do this. Production must not (wrong runtime).           |
| D3 | None                                            | Only if B does not need user `arkenv()` to change (B2/B3/B4). |
| D4 | Document poking the global key                  | Escape hatch, not a product.                                  |

## Evaluation

**A1 In-process import** — Hits comments, re-exports, every validator, ADR 0013. Simplicity: one Jiti. Footgun: executes user code (accepted on #1234). Handshake: whatever B needs. This is the load story #1314 already chose.

**A2 Static parse** — Looks simple until Zod/Valibot/imports. Violates ADR 0013. Fails validator neutrality. E-tier.

**A3 Subprocess inspector** — Isolates the CLI’s env from the app’s. Still needs B in the child. Maintenance: spawn, version, Windows. Does not remove recording vs stub.

**A4 Repo regex** — Already exists; misses declared-but-unused keys; not a schema. Does not feed `check`.

**A5 Second export** — Honest and simple. App tax. Dual source of truth. Fails “`env.ts` stays `arkenv({...})`.”

**B1 Skip and record** — Matches #1314 (2)(3)(5): you keep the **argument**, so `check` can `parse(def, envDict)` later. Honesty: we do not pretend the environment was valid. App tax: none. Simplicity cost: a flag in `arkenv()`, a bag, extractors for compiled ArkType / Zod / Valibot defaults. Footgun: capture returns `{}`, so module-scope reads of `env` are undefined (documented). Handshake: **required** (D1), and old core ignores the flag (skew). Not simpler than a stub; it is the option that keeps the schema.

**B2 Stub env until parse succeeds** — Simpler core (no flag). D3. Fails #1314 as written: you get **outputs**, not defs. Required keys still fail unless you invent values; invented `"0"` / `"http://x"` is a second schema. `hasDefault` is invisible (the default already applied). `check` against a *different* dict means a second boot or you still need the def. Footgun: CLI’s leftover env can make `sync` succeed with the wrong world. Honesty: looks like a real boot.

**B3 Populate and boot** — Best `check` if `check` *is* “run `env.ts`.” Zero core change. `sync` with empty env still throws. Shared primitive: no. If we drop “one loader for both,” this is the simple `check`.

**B4 Catch `ArkEnvError`** — No core change. Missing vars ≈ keys; defaults never appear as errors; you never get per-key schema. Incomplete `sync`. Ugly `check`.

**B5 / B6 dryRun / collectKeys as the user’s call** — Clean APIs for a file the CLI authors. Useless for files that already call `arkenv()`. Equivalent to B10.

**B7 Monkey-patch** — Same as B1 without a supported hook. Maintenance hell. Skew still exists if patch misses the copy Jiti loaded.

**B8 Stash after parse** — Needs B2/B3 first. Then you have def **and** values. Extra API on the env object is an app footgun (`env` is the product). WeakMap is honest but still gated on successful parse.

**B9 Proxy return** — Tried to make module-scope reads safer. Jiti evaluation broke. Record + `{}` stays.

**B10 Wrap in `env.ts`** — Export-surface reject. Not simpler for users.

**C1 From recorded def** — What `sync` (example file) and `check` (re-parse) both want. Cost: `declaredKeysFromDefinitions` heuristics.

**C2 From booted env** — Enough for a naive `.env.example` of *present* keys. Wrong for optional/defaulted keys and for `check`’s schema.

**C3 From errors** — Partial key list on failure only.

**C4 `getSchemaKeys` only** — Already used as a **fallback** inside C1 for compiled types. Not a full C.

**D1 globalThis** — Makes B1 work across Jiti copies. Skew: old `arkenv()` never records; upgrade hint. Not needed for B2/B3.

**D2 Alias to CLI core** — Tests only. Production would validate with the CLI’s ArkType/Zod, not the project’s. Recorded as a non-fix on #962/#1234.

**D3 None** — Simplicity win if B2/B3/B4. Those fail the full problem.

**D4 Document the key** — Ugly; freeze the name. A-tier escape, not S.

## Tier list

Complete answers are **stacks**.

**S (chosen / default story)**

- **A1 + B1 + C1 + D1** — Import with Jiti. `arkenv()` short-circuits and records `def`. CLI extracts keys/schema/`hasDefault`. Flag lives on `globalThis` so the user’s installed core sees it. App file unchanged. This is the only stack that gives `sync` an empty-env schema **and** `check` a def to parse against `--env-file` without a second validator. It is not the fewest lines in core; it is the fewest *product* lies.

**A**

- **`check` without the loader (B3):** set env from files, import `env.ts`, print `ArkEnvError` or success. Optional later if `check` does not need a detached schema. Do not use this for `sync`. Do not rip B1 out of #1622 to get this.
- **Export-surface S** (other note): do not publish `begin`/`end` on the `arkenv()` barrel.

**B**

- **A1 + B2 + C2 + D3** — Stub env, boot, `Object.keys`. Simpler. Wrong metadata, weak `check`, CLI-env footgun. Acceptable only if we redefine #1314 as “example file of keys that survived a fake boot.”
- **A3 + B1 + C1 + D1** — Same engine in a subprocess. Isolation nicety, not required to close the loader.

**C**

- **B4 + C3** — Catch errors, scrape paths. No core change, incomplete.
- **B8 after B3** — Stash def after a real boot. Still no empty-env `sync`.

**D**

- **A5** second export; **B5/B6/B10** user-call changes; **B7** monkey-patch; **B9** Proxy; **D2** production alias.

**E**

- **A2** parse schema text (ADR 0013).
- **A4** usage regex as the schema.

## S and A usage

### Use case 1: App `env.ts`

**S:**

```ts
import { arkenv } from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
  PORT: "number = 3000",
});
```

**A (`check` as boot):** same file. No capture.

### Use case 2: `arkenv sync` with empty environment

**S:**

```text
beginSchemaCapture()  // CLI, @repo/utils → globalThis
jiti(schemaPath)      // user's arkenv() records def, returns {}
defs = endSchemaCapture()
keys = declaredKeysFromDefinitions(defs)
write .env.example from keys
```

**A (stub boot):** fill `process.env` with placeholders → `arkenv()` throws or writes invented values → example file is a guess. Not S.

### Use case 3: `arkenv check --env-file .env.test`

**S:**

```text
load schema via S (same as sync)
parse(def, mergedEnv) with the same core parse as runtime
```

**A:**

```text
assign mergedEnv onto process.env
jiti(schemaPath)  // real arkenv() validation
success or ArkEnvError
```

A is simpler for `check` alone. It does not produce a schema for `sync`. Sharing one primitive keeps B1.

### Use case 4: Zod / Valibot / `arkenv(type({...}))`

**S:** Jiti runs the user’s validators; recorded `def` is the map or compiled type; extractors already in `declared-keys.ts`.

**B2:** would need each validator to accept dummy strings — not validator-neutral.

### Use case 5: New CLI, old `@arkenv/core`

**S:** Flag set; old `arkenv()` validates; `NO_SCHEMA` / validation error + upgrade hint. Known skew.

**B2/B3:** no skew (no flag), but empty-env `sync` still fails on old *and* new core.

## Current lean

- **#1622 keeps S (A1+B1+C1+D1).** Recording is the mechanism that satisfies the shared loader. Stub-env is simpler and **insufficient** for the problem as written, not an untried shortcut we should switch to.
- **Do not** add production Jiti aliases, a capture Proxy, or author-facing `begin`/`end`.
- **A-tier:** `check` may still *also* offer “just boot `env.ts`” later; that is extra, not a replacement for recording.
- Export surface stays the other note’s S (unpublished start/stop). Canonical decision: [ADR 0027](./adr/0027-cli-schema-inspection.md).

## Changelog of this note

- 2026-08-27: First write-up. Scores import vs parse, record vs stub vs boot vs catch, result shapes, and handshake — the eval #1314 skipped.
- 2026-08-27: Promoted S stacks to ADR 0027. On v1, schema-text parse is ADR 0013 (not 0010).
