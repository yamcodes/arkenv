# ADR 0021: Canonical env object surface across integrations (Vite/Bun transform design)

## Status

Accepted

Amended 2026-08-28: [ADR 0020](./0020-strict-layout-complexity-budget.md) withdraws dedicated strict layout and the client-import blocker. Decision items 3–4 originally treated strict layout as the name/type escape hatch and reused ADR 0016’s Vite plugin (this file’s historical “ADR 0013” references mean that compile-time blocker). Value isolation on the transformed/proxied `env.ts` is unchanged.

## Context

Two integration families exist today:

- **Codegen frameworks (Next, Nuxt):** users import a validated `env` object from `env.ts`; a runtime proxy enforces the client/server boundary (ADR 0012), strict layouts add compile-time import blocking (ADR 0013), and build plumbing is shared via `@arkenv/build` (ADR 0009).
- **Plugin-env frameworks (Vite, Bun):** the plugin validates at build time and rewrites native accessors - Vite `define` inlines coerced literals for `VITE_`-prefixed keys, the Bun plugin statically replaces `process.env.BUN_PUBLIC_*` - with types supplied by manual ambient augmentation (`ImportMetaEnvAugmented`, `ProcessEnvAugmented`).

Issue [#1105](https://github.com/yamcodes/arkenv/issues/1105) asked what the Vite/Bun plugins should learn from the Next.js work (#1084, #1092). Deciding that required settling whether the two families should converge on one surface at all. The forces:

1. **Coercion is a core product property (ADR 0002).** Validated outputs are real `number`/`boolean` values, not strings. Any surface must deliver those types honestly at runtime.
2. **Vite and Bun are fullstack runtimes.** TanStack Start, React Router 7, SolidStart, and `Bun.serve` run server code that reads secrets at deploy time. Build-time-only validation checks the build machine's env, not the production server's. Boot-time fail-fast on `DATABASE_URL` - ArkEnv's core value proposition - is structurally outside the plugin+dts model. The `with-solid-start` example evidences the boundary: its schema contains only `VITE_`-prefixed keys because the model has nothing to offer server env.
3. **Isolation is a module-graph concern.** Both existing boundaries (ADR 0012 conditional exports, ADR 0013 client-import blocking) operate on imports of env modules. Ambient globals cannot be boundary-enforced.
4. **Static rewriting has an honesty ceiling.** `define`/rewrite replaces exact static property reads only. The bare `import.meta.env` object still holds raw strings, so the same key can be a `number` via static access and a `string` via dynamic access (`import.meta.env[key]`, spreads, aliased references) in one bundle - while the ambient `.d.ts` claims `number` unconditionally. This is architectural: no amount of transform cleverness rewrites every access path. By contrast, a materialized runtime object has no aliasing problem - types and values agree under every access pattern.
5. **Ecosystem precedent.** The hosts with the most bundler power chose imported env modules with static-inlining transports: SvelteKit's `$env/static/private` / `$env/static/public` and Astro's `astro:env/client` / `astro:env/server`. Bundler power determines how cheaply the module surface can be implemented - not whether ambient access is preferable. Next's codegen apparatus (factory files, `runtimeEnv` destructuring, jiti) is the price of implementing the object surface *without* bundler power, not a property of the pattern.
6. **Shared plumbing already points here.** ADR 0009 built `@arkenv/build` for exactly this reuse, and ADR 0014's consequences note that `clientPrefix` "should become first-class for all frameworks (including Vite/Bun)". Plumbing is surface-agnostic, so this is enablement rather than proof - but the machinery exists.

## Directions considered

1. **Keep the capability fork - plugin + `.d.ts` stays the Vite/Bun surface (rejected).**
   *For:* zero-refactor adoption for existing apps (one ambient `.d.ts` line, no call-site changes); leanest possible client output for SPAs (no imports, no runtime object, no validator bytes); coerced-literal inlining genuinely works for static reads and is a real capability Next lacks.
   *Against:* the honesty ceiling of force 4; no server-side story for fullstack apps (force 2) - the de-facto answer becomes "hand-wire core `arkenv` on the server", i.e. two unsupported idioms per app; no possible client/server boundary (force 3); the product permanently teaches two dialects across docs, CLI, and presets.

2. **Port Next's codegen apparatus (`env.gen.ts` + `runtimeEnv`) to Vite/Bun (rejected).** This was the original direction sketched on #1105. It ports the *workaround*, not the lesson: factory files on disk, schema watching, committed generated code, and user-visible `runtimeEnv` wiring exist in Next because ArkEnv cannot control Next's bundler. On hosts where ArkEnv owns the transform, that apparatus is pure overhead - and it would create a second DX path the CLI scaffold has to carry alongside the plugin path.

3. **Split the surface by module graph - object on the server, ambient accessors on the client (rejected).** A tempting middle: give Vite/Bun the layout model and boot validation server-side while keeping `import.meta.env`/`process.env` client-side. But this productizes the exact incoherence being resolved: two syntaxes per fullstack codebase as the *recommended* default. Its only independent justification was avoiding client-object costs, which the transform design (below) deletes.

4. **The opposite fold - move Next/Nuxt to plugin + `.d.ts` (rejected).** Tested for symmetry: it fails for host reasons. Next inlines strings only and strips non-static reads, so ArkEnv cannot make `process.env` coercion-correct there; Nuxt's public values live in `runtimeConfig`, not browser `process.env`. The fold would forfeit boot-time validation, coerced output types, and the proxy/conditional-export boundary - the three guarantees prior ADRs identify as the product core. The asymmetry is decisive: the object surface subsumes everything the plugin model does; the reverse does not hold.

5. **Canonical env object everywhere, via the transform design for Vite/Bun (chosen).**

## Decision

The imported `env` object is the canonical surface for **all** integrations. For Vite and Bun it is implemented with the **transform design** (SvelteKit-shaped, not Next-shaped):

1. **`env.ts` is the single typed source of truth.** The user writes `createEnv` / `arkenv` in `env.ts`; types flow from normal inference. No generated declaration files, no committed codegen artifacts, no user-maintained `runtimeEnv` destructuring.
2. **Server graph executes `env.ts` as-is.** Validation and coercion run at server boot against the real deployment environment - the fail-fast guarantee fullstack Vite/Bun apps currently lack.
3. **Client graph gets a transformed module.** The plugin (which already owns validation in Vite's `config` hook / Bun's `setup`) rewrites the env module in client bundles: client-prefixed keys become inlined, build-validated, *coerced* literals; the validator import is stripped; server-only keys become a small throwing guard. No validator ships to the browser and nothing is re-validated client-side. The guard is the same "trust the proxy" stance as ADR 0010. Flat-layout name/type leak remains; name/type isolation is the documented two-module recipe ([ADR 0020](./0020-strict-layout-complexity-budget.md)), not a plugin escape hatch.
4. **No compile-time import blocker.** ADR 0020 drops the Vite/Bun/Nuxt client-graph block of `env/server.ts`. Plugin `schemaPath` is the (flat or recipe-client) env module. A second server file using `@arkenv/core` is outside the transform; importing it from client code is user-land.
5. **Plumbing consolidates in `@arkenv/build`** (layout resolution, key extraction, watching), and `clientPrefix` becomes first-class plugin config for all frameworks per ADR 0014's note.
6. **Drop schema/define and ambient declarations for v1 (Option 3).** The legacy `arkenv(schema)` plugin argument with native-accessor `define` rewriting and ambient `.d.ts` augmentations (`ImportMetaEnvAugmented`, `ProcessEnvAugmented`) is completely removed from v1. Ambient static rewriting (#1440) is rejected because it cannot overcome the honesty ceiling of dynamic property reads and cannot enforce security boundaries. In v1, `import { env } from "./env"` is the sole supported path.
7. **The Nuxt proxy preference-order defect is fixed in the same milestone.** The security proxy currently prefers raw `useRuntimeConfig()` / `__NUXT__.config.public` / `process.env` strings over the coerced validation target on *both* the client and server branches - and on the server, `prop in process.env` is almost always true for schema keys, making coerced values near-unreachable in the common path. The aligned model's honesty claim is only as good as its weakest integration. Because Nitro applies `NUXT_PUBLIC_*` overrides as strings at boot, the fix requires a boot-time coercion pass (e.g. a Nitro plugin), not just build-time injection.

## Landing strategy

The implementation is **v1-native**; it does not land on `dev` first.

1. **The transform design ships on the `v1` branch only**, where it can land whole: defaults flipped, CLI scaffold collapsed to one family, and the held-back Next/Nuxt build-tool changes included - one migration story, no compatibility shims. Implementing on `dev` first would build the hardest plumbing (client-graph discrimination, HMR invalidation, alias handling) on a foundation `v1` replaces, forcing a re-implementation disguised as a forward-port and risking behavioral drift between generations.
2. **Clean v1 surface with stable v0 isolation.** The `dev` branch keeps schema/define for existing v0 users. The `v1` branch drops schema/define completely, presenting a unified `env` object model without dual-surface baggage. Migration documentation guides v0 users to the v1 canonical object.
3. **The Nuxt proxy preference-order fix is the exception**: it is a bug affecting current users, so it lands on `dev` first and is forward-ported to `v1` per the standard dual-tracking flow.
4. **This ADR lands on `dev`**, since `docs/adr/` is the central decision log on the default branch (precedent: ADR 0014 recording v1 forward-port plans from `dev`).

## Consequences

- **One mental model.** `import { env } from "./env"` works identically in Next, Nuxt, Vite, and Bun apps, on both sides of the network boundary. Docs, the arkenv skill, hosting presets, and the CLI scaffold converge on one family (the #1316 codegen-vs-plugin-env scaffold seam dissolves rather than hardens).
- **Fullstack Vite/Bun gains boot-time validation and a real security boundary** - capabilities the plugin+dts model could not express at any cost.
- **The bill is Nuxt-module-shaped, not zero.** The plugin must identify the env module (convention/config, like ADR 0013's `schemaPath`) and discriminate client vs. server graphs (Vite's `ssr` transform flag; Bun's per-target `onLoad`), including HMR invalidation, aliased imports, and monorepo paths.
- **Dead-code elimination is lost through the object.** `if (import.meta.env.VITE_FLAG)` constant-folds; `if (env.VITE_FLAG)` does not. This trade-off is accepted: the bundle overhead is negligible (a single property read on a plain JS object, zero validator bytes shipped to client bundles, and a minimal throwing guard stub) and delivers fullstack consistency and boot-time security.
- **Client chunks gain a small guard stub** (a few bytes of emitted getter code) in exchange for shipping no validator and doing no client-side re-validation.
- **No dual-surface maintenance.** Dropping schema/define avoids maintaining parallel ambient `.d.ts` augmentations and avoids confusing documentation across frameworks.
- **Maintenance tripwire.** `@remarks` notes on the Vite/Bun transform entry points should reference this ADR so contributors do not reintroduce `env.gen.ts`-style codegen, client-side validation, or `runtimeEnv` wiring on hosts that own their transform.

## Numbering note

On `dev` this decision was recorded as `0015-env-object-canonical-surface`. On `v1` that number is already used by the Next.js conditional-exports ADR, so this port is **ADR 0021**.
