# Framework subpath exports for strict layout

To decide which `@arkenv/nextjs` and `@arkenv/nuxt` subpath exports remain published, and to document the import mental model for flat versus strict layout.

## Context & problem

Framework integrations expose multiple entry points so bundlers can enforce server/client boundaries in strict layout. Over time, a `./shared` subpath was added for internal schema modules (`env/internal/shared.ts`) that only need `import { type } from "…"`.

`@arkenv/core` already exports `type`. The `./shared` subpath therefore duplicates a capability available from the core package without adding boundary semantics - unlike `./client` and `./server`, which carry compile-time routing, `server-only`, proxy/`extends` behavior, and `strictLayout` routing.

We evaluated three postures for the export surface:

- **Option 1: Keep all subpaths including `./shared` (rejected).** Preserves backward compatibility but maintains a redundant export that confuses the mental model and suggests framework-specific schema tooling where core `@arkenv/core` suffices.
- **Option 2: Remove `./shared`; keep `./client` and `./server` (chosen).** Strict-layout internal schema modules import `type` from `@arkenv/core`. Flat layout continues to use the default package entry. `/client` and `/server` retain their boundary guarantees.
- **Option 3: Remove all subpaths (rejected).** Would break strict layout compile-time boundaries documented in [ADR 0012](./0012-nextjs-conditional-exports-boundary.md) and [ADR 0013](./0013-nuxt-vite-compile-time-boundary.md).

## Decision

We adopt **Option 2**: remove `./shared`; keep the default entry, `./client`, and `./server`.

| Export                                      | Verdict    | Rationale                                                                                                                                                                                     |
| :------------------------------------------ | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@arkenv/nextjs` / `@arkenv/nuxt` (default) | **Keep**   | Flat layout entry; bundler resolves server vs client build ([ADR 0012](./0012-nextjs-conditional-exports-boundary.md) / Nuxt proxy)                                                           |
| `./client`                                  | **Keep**   | Strict layout compile-time boundary + public-prefix type constraints                                                                                                                          |
| `./server`                                  | **Keep**   | Strict layout compile-time boundary (`server-only` on Next.js; Vite plugin blocklist on Nuxt per [ADR 0013](./0013-nuxt-vite-compile-time-boundary.md)) + framework proxy/`extends` semantics |
| `./shared`                                  | **Remove** | Documented strict-layout usage is schema-only (`import { type } from "…/shared"`); `@arkenv/core` already exports `type`                                                                      |

### Mental model

- **Flat layout:** import from `@arkenv/nextjs` or `@arkenv/nuxt` - one entry point, bundler picks the build.
- **Strict layout:** import from `@arkenv/nextjs/client` and `@arkenv/nextjs/server` (or Nuxt equivalents).
- **Standalone server code** (scripts, one-off Node entry points outside the env module graph): `import { arkenv } from "@arkenv/core"`.
- **Internal schema modules** (`env/internal/shared.ts`): `import { type } from "@arkenv/core"`.

Do **not** present `/server` as a thin re-export of core `@arkenv/core`. It carries `server-only`, proxy/`extends` behavior, and `strictLayout: "server"` routing.

### Migration

Replace `@arkenv/nextjs/shared` and `@arkenv/nuxt/shared` with `import { type } from "@arkenv/core"` in internal schema modules. No change to `/client` or `/server` behavior.

## Consequences

- **Breaking change.** Removing a published subpath export requires a major semver bump for `@arkenv/nextjs` and `@arkenv/nuxt`.
- **Simpler mental model.** Strict layout has two boundary entry points plus `@arkenv/core` for schema-only modules.
- **Lower maintenance.** One fewer conditional build artifact per framework package.
- **Docs and scaffolding updated.** CLI output, examples, playgrounds, and layout guides reflect the new import path.
- **`/client` and `/server` unchanged.** Compile-time boundary guarantees from ADR 0012 and ADR 0013 are preserved.
