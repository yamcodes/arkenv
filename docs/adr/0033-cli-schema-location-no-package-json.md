# ADR 0033: CLI schema location is `--schema` + convention only

## Status

Accepted

## Context

`arkenv init` used to write a `package.json` `"arkenv"` field (string path or
`{ "schema": "…" }`) so CLI commands could find the schema module. Discovery
order was `--schema` → that field → convention paths (`env.ts`, `src/env.ts`,
…).

The field was almost undocumented and easy to confuse with runtime
`arkenv()` options (`@arkenv/core` / `@arkenv/standard`). That second config
surface invited agents and humans to treat `package.json` as CLI config next
to TypeScript runtime behavior.

[#1906](https://github.com/yamcodes/arkenv/issues/1906) scored two paths:
document and keep the pointer, or remove it. The product call was **remove**.

## Decision

1. **Do not write** `package.json` `"arkenv"` during `init` (or any other
   scaffolder path).
2. **Do not read** `package.json` `"arkenv"` during schema discovery.
   Resolution is `--schema` / `-s` → flat convention candidates only
   (`env.ts`, `src/env.ts`, and related `.js` / `.mjs` extensions).
3. **Do not auto-discover** split-layout leftovers such as `env/server.ts`
   or `src/env/server.ts`. Those filenames remain a documented two-module
   *recipe* in framework docs; they are not CLI discovery conventions. Point
   `check` (and related commands) at a loadable module with `--schema` —
   typically the recipe's client schema or a flat `env.ts`. A server module
   that imports `server-only` cannot be evaluated by the CLI's plain-Node
   Jiti loader.
4. **Ignore leftovers**: if an older project still has a `package.json`
   `"arkenv"` field, the CLI does not fail on it and does not use it.
5. **Keep the boundary clear**: scripts and `--schema` (or a flat
   convention path) locate the schema for the CLI; TypeScript `arkenv()`
   options own runtime behavior. `package.json` is not a CLI config surface
   for schema location.

## Rejected alternatives

- **Document and keep the pointer.** Standard tooling pattern
  (`"prettier"`, `"babel"`), reversible, and already written by `init`.
  Rejected because it remains a second config surface next to `arkenv()`,
  prefers a magical package field over explicit `--schema` in scripts, and
  was not a known monorepo pain point once convention paths cover scaffold.
- **Deprecation warning then hard fail.** Unnecessary for a barely
  documented field mostly written by `init`; ignore-and-drop is enough.

## Consequences

- Projects with a custom schema path must put it on `--schema` in scripts
  (for example `"check": "arkenv check --schema config/env.ts"`).
- Split-recipe projects that keep `env/client.ts` + `env/server.ts` must
  pass `--schema` at the client (or other loadable) module, or use a flat
  `env.ts` — the CLI will not pick leftover `/server` filenames by
  convention ([ADR 0020](0020-strict-layout-complexity-budget.md)). Do not
  point `check` at a server file that imports `server-only`.
- Docs, the domain glossary, and the ArkEnv skill describe discovery as
  `--schema` + flat convention only.
- Related CLI ADRs ([0027](0027-cli-schema-inspection.md),
  [0030](0030-cli-env-example-command-name.md)) stay about inspect / command
  naming; this record owns the **location** boundary.
