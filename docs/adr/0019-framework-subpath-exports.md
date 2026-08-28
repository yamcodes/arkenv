# ADR 0019: Framework subpath exports for strict layout

To decide which `@arkenv/nextjs` and `@arkenv/nuxt` subpath exports remain published, and to document the import mental model for flat versus strict layout.

## Status

Accepted (amended 2026-08-28; [ADR 0020](./0020-strict-layout-complexity-budget.md), [#1634](https://github.com/yamcodes/arkenv/issues/1634))

Option 2 (keep `./client` and `./server`) applied while dedicated strict layout existed. v1 alpha hard-removes those subpaths with the layout engine. Option 3 is now the standing export-surface call for the split recipe. The default package entry stays: it is the flat `env.ts` boundary (ADR 0015 / Nuxt proxy), not a strict-layout feature. `./shared` remains removed.

## Context & problem

Framework integrations expose multiple entry points so bundlers can enforce server/client boundaries in strict layout. Over time, a `./shared` subpath was added for internal schema modules (`env/internal/shared.ts`) that only need `import { type } from "…"`.

`@arkenv/core` already exports `type`. The `./shared` subpath therefore duplicates a capability available from the core package without adding boundary semantics - unlike `./client` and `./server`, which carry compile-time routing, `server-only`, proxy/`extends` behavior, and `strictLayout` routing.

We evaluated three postures for the export surface:

- **Option 1: Keep all subpaths including `./shared` (rejected).** Preserves backward compatibility but maintains a redundant export that confuses the mental model and suggests framework-specific schema tooling where core `@arkenv/core` suffices.
- **Option 2: Remove `./shared`; keep `./client` and `./server` (chosen in the original pass; superseded for `/client` `/server` by ADR 0020).** Internal schema modules import `type` from `@arkenv/core`. Flat layout continues to use the default package entry.
- **Option 3: Remove all subpaths (rejected in the original pass; accepted for v1 alpha under ADR 0020).** The original reject assumed dedicated strict layout still needed `/client` and `/server` for compile-time boundaries ([ADR 0015](./0015-nextjs-conditional-exports-boundary.md), [ADR 0016](./0016-nuxt-vite-compile-time-boundary.md)). ADR 0020 drops that product. Default-entry conditional exports on the single `env.ts` are unrelated and stay.

## Decision

**Original:** Option 2 — remove `./shared`; keep the default entry, `./client`, and `./server`.

**Standing (ADR 0020):** Option 3 for the layout-engine subpaths. Keep the default entry. Remove `./client` and `./server` (and Standard Schema twins) in the v1 alpha hard cut. Split-recipe server modules import `@arkenv/core`; Next users may add `import "server-only"` themselves. Do not present `/server` as an ArkEnv product.

| Export                                      | Verdict (standing) | Rationale                                                                                                                                                 |
| :------------------------------------------ | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@arkenv/nextjs` / `@arkenv/nuxt` (default) | **Keep**           | Flat layout entry; bundler resolves server vs client build ([ADR 0015](./0015-nextjs-conditional-exports-boundary.md) / Nuxt proxy)                       |
| `./client`                                  | **Remove**         | Layout-engine subpath; withdrawn with dedicated strict ([ADR 0020](./0020-strict-layout-complexity-budget.md))                                            |
| `./server`                                  | **Remove**         | Same. Split-recipe server modules use `@arkenv/core` (+ optional Next `server-only`). [ADR 0016](./0016-nuxt-vite-compile-time-boundary.md) is superseded |
| `./shared`                                  | **Remove**         | Schema-only; `@arkenv/core` already exports `type`                                                                                                        |

### Mental model

- **Flat layout:** import from `@arkenv/nextjs` or `@arkenv/nuxt` - one entry point, bundler picks the build.
- **Split-file recipe (ADR 0020):** client module via the default entry / codegen; server module via `@arkenv/core`. Two import paths. Optional Next `import "server-only"`. Not package subpaths.
- **Standalone server code** (scripts, one-off Node entry points outside the env module graph): `import arkenv from "@arkenv/core"`.

Do **not** add `/server` as a thin re-export of `@arkenv/core`. The layout engine that made `/server` more than core is what ADR 0020 removes.

### Migration

Replace `@arkenv/nextjs/shared` and `@arkenv/nuxt/shared` with `import { type } from "@arkenv/core"`. After the ADR 0020 cut, also replace `/client` and `/server` imports: client via the default entry / codegen; server via `@arkenv/core`.

## Consequences

- **Breaking change.** Removing published subpaths requires a major (v1 alpha) cut for `@arkenv/nextjs` and `@arkenv/nuxt`.
- **Simpler mental model.** One default entry for flat `env.ts`. Split recipe uses `@arkenv/core` on the server module.
- **Lower maintenance.** No layout-engine subpaths, auto-extend, or import blockers.
- **Docs and scaffolding** collapse to one `env.ts`; the recipe is an advanced page.
