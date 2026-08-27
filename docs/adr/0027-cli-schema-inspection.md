# ADR 0027: CLI schema inspection (import, record, unpublished handshake)

## Status

Accepted

## Context

`arkenv sync` ([#1234](https://github.com/yamcodes/arkenv/issues/1234)) and `arkenv check` ([#962](https://github.com/yamcodes/arkenv/issues/962)) need one CLI primitive that reads a user’s flat `env.ts` (`export const env = arkenv({ ... })`) and returns **declared keys and per-key schema**, not a coerced `env` object.

`arkenv()` validates eagerly on call. Importing that file from the CLI with an empty or CLI-owned `process.env` either throws or validates the wrong world.

[#1314](https://github.com/yamcodes/arkenv/issues/1314) already chose **import, don’t parse** (Jiti-class loader) so the CLI is not a mini ArkType/Zod compiler. That continues [ADR 0013](0013-flat-layout-codegen-type-strategy.md) (`flat-layout-codegen-type-strategy`): codegen and the CLI must not statically compile schema grammar. The issue named a dry-run hook **or** an env stub and did not score them.

Two hat loops on [#1622](https://github.com/yamcodes/arkenv/pull/1622) made the trade-off explicit:

- Mechanism: [docs/schema-loader-mechanism.md](../schema-loader-mechanism.md)
- Export surface: [docs/schema-capture-export-surface.md](../schema-capture-export-surface.md)

The user’s `env.ts` imports `@arkenv/core` / `@arkenv/standard` from **their** `node_modules`. The CLI’s copy of those packages is a different module instance. A flag on the CLI graph alone does not reach `arkenv()`.

## Decision

Ship **mechanism A1 + B1 + C1 + D1** and **export-surface A1 + B1**:

1. **Import** the schema module in-process (Jiti). Do not parse schema source text.
2. **Skip validation and record** the object (or compiled type) passed to `arkenv()`. `arkenv()` returns a value-less `{}`. Schema modules stay declarative; they must not require real env values at module scope.
3. **Extract** ordered keys, per-key schema, and best-effort `hasDefault` from that recorded definition (including compiled ArkType `json` and Zod/Valibot shapes). This is what `sync` writes and what `check` can re-`parse` against an arbitrary env dict.
4. **Handshake** through `globalThis.__ARKENV_SCHEMA_CAPTURE__` so a Jiti-loaded user `arkenv()` sees the CLI’s capture flag.
5. **Do not export** `beginSchemaCapture` / `endSchemaCapture` / `isCapturingSchema` from `@arkenv/core` or `@arkenv/standard`. The CLI starts/stops capture via unpublished `@repo/utils`. App authors keep `export const env = arkenv({ ... })`.
6. **Production Jiti has no aliases** onto the CLI’s core. Tests may alias workspace source. A new CLI with an old installed core fails inspect with an upgrade hint — do not “fix” that by substituting the CLI’s runtime.

`check` may later *also* boot `env.ts` against a populated env (no loader). That is optional. It does not replace recording for `sync`.

## Rejected alternatives

- **Stub / fill `process.env` until validation succeeds.** Fewer core lines. Yields coerced values, not definitions; invented placeholders are a second schema; `hasDefault` disappears; `check` against `--env-file` still needs the def or a second boot; the CLI’s leftover env can leak into a “successful” `sync`.
- **Populate env and import** as the only strategy. Fine for `check` alone. Empty-env `sync` still throws.
- **Catch `ArkEnvError` and scrape paths.** Incomplete keys; no schema objects; defaults that never ran are invisible.
- **`arkenv(def, { dryRun: true })` / public `collectKeys` / wrap `begin`/`end` in `env.ts`.** The CLI does not author that call. App tax.
- **Parse `env.ts` as text.** Forbidden by ADR 0013 / the #1314 “import, don’t parse” call.
- **Jiti-alias the user’s `@arkenv/core` to the CLI copy.** Inspects/validates with the wrong runtime.
- **Publish capture on the `arkenv()` barrel or `/internal`.** Looks like app API; autocomplete and changelog lie. `/tooling` remains optional if a tool *outside* this repo needs a supported import.
- **Capture Proxy instead of `{}`.** Broke Jiti evaluation.

## Consequences

- Core and standard gain a short-circuit that is **not** a public API. Releases still need a patch so installed copies honor the flag.
- `sync` and `check` share one loader that returns schema, not boot output.
- Capture-mode `env` is empty: `env.NODE_ENV === "production"` is fine; guards that need a real value fail with a contract hint.
- Version skew is accepted and hinted, not solved, until `sync`/`check` consume the loader.
- Future reviews should not re-propose env stubbing or schema parsing for this primitive unless the product drops “keys + schema with empty env” or “one loader for `sync` and `check`.”
