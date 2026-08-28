# ADR 0028: Do not hook `@next/env` for `@arkenv/nextjs`

## Status

Accepted

## Context

[#1598](https://github.com/yamcodes/arkenv/issues/1598) asked whether
`@arkenv/nextjs` should integrate with Next.js's environment pipeline by
augmenting `@next/env` and/or compiler passes (the Varlock-style
approach: package-manager `overrides` that replace Next's loader).

The pitch is that native `process.env.NEXT_PUBLIC_*` identifiers get
SWC/Turbopack constant folding and client secret stripping, while an
imported `env` object does not.

That investigation sat in the same hat pass as virtual `.arkenv/`
placement and client feature-flag DCE. Those tracks are orthogonal.
This record is only the boot-pipeline call.

Today `@arkenv/nextjs` validates during `withArkEnv` (Jiti per
[ADR 0014](0014-nextjs-jiti-build-time-validation.md)) and isolates
secret *values* with conditional exports plus a client proxy
([ADR 0015](0015-nextjs-conditional-exports-boundary.md)). Client
inlining still needs a static `runtimeEnv` destructure
([ADR 0005](0005-nextjs-runtime-env.md)). Next's own env object is
strings. ArkEnv's product is coerced types (`PORT` as a number,
`"false"` as boolean).

Scoring of the alternatives lives in
[the hat evaluation](../design/nextjs-codegen-runtime-evaluation.md)
(Layer A and the D-tier notes on A1).

## Decision

Do **not** intercept, replace, or monkey-patch `@next/env`.

1. **Boot stays in `withArkEnv`.** Schema load and fail-fast validation
   run from the Next config wrapper. Apps keep
   `export default withArkEnv(nextConfig)` (object or function form).
   Do not instruct users to `overrides`/`resolutions` Next internals,
   and do not ship a forked `@next/env`.
2. **Keep ADR 0015 for secret values.** Next rewriting
   `process.env.SECRET` to `undefined` in Client Components does not
   apply to `import { env } from "./env"`. The imported object is opaque
   to that pass. Value isolation stays conditional exports + proxy.
   Compile-time hiding of secret *names and types* is the documented
   two-module recipe ([ADR 0020](./0020-strict-layout-complexity-budget.md)),
   not a compiler hook and not a dedicated ArkEnv layout engine.
3. **Coercion stays in ArkEnv.** Routing values through Next's string
   env transport would undo honest numbers, booleans, and defaults. The
   native pipeline is not a substitute for `arkenv()`.
4. **DCE is a different RFC.** Minifier folding of
   `if (env.NEXT_PUBLIC_FLAG)` is issue
   [#1599](https://github.com/yamcodes/arkenv/issues/1599). That is not a
   reason to own `@next/env`.

v1 still intends to lean on Next 15+ native `next.config.ts` execution
(hat option A2) so Jiti can eventually leave the Next adapter. That
follow-on amends [ADR 0014](0014-nextjs-jiti-build-time-validation.md).
It does not reopen this decision: native config execution is still
`withArkEnv`, not an `@next/env` hijack.

## Rejected alternatives

- **A1 — Varlock-style `@next/env` override.** Fragile across Next
  minor and canary releases. Lockfile `overrides`/`resolutions` fight
  pnpm/Yarn/Bun in monorepos and Docker. Standalone output and
  `output: "standalone"` copy Next's own loader, not a patched one.
  There is no public plugin API that makes this stable.
- **Compiler/loader secret stripping of the `env` object.** Turbopack
  does not accept custom JS/TS SWC plugins (hat C3 / F-tier). Webpack
  loaders would split the two bundlers. ADR 0015 already covers values;
  names/types need a module split.
- **Unwrapped `import "./env"` in `next.config.ts` only (A4).** Drops
  `withArkEnv` alias injection, codegen, and watch. Users forget the
  side-effect import. The wrapper is the product surface.

## Consequences

- `@arkenv/nextjs` remains a documented `withArkEnv` wrapper plus
  package exports. Install does not require `overrides`.
- Webpack and Turbopack stay on public config (`resolve.alias` /
  `turbopack.resolveAlias`), not private Next env internals.
- Future reviews must not revive `@next/env` patching to "get DCE for
  free" or to drop codegen. DCE is issue
  [#1599](https://github.com/yamcodes/arkenv/issues/1599). Artifact
  placement is [#1402](https://github.com/yamcodes/arkenv/issues/1402).
- Dropping Jiti (A2) is allowed later without revisiting A1.
