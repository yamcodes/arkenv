# ADR 0035: No Nub plugin or Varlock-style Nub runtime hand-off

## Status

Accepted

## Context

Nub ([nubjs.com](https://nubjs.com/)) is the monorepo and examples
toolchain for ArkEnv. Nub plugins are `nub-<verb>` CLI bins
([Nub plugins](https://nubjs.com/docs/plugins)) — the same convention as
`git-foo` / `cargo-foo`. Separately, Nub has first-party Varlock support:
when a project carries an `@env-spec` `.env.schema`, Nub stops loading
`.env*` itself and hands the process environment to Varlock
([Nub Varlock](https://nubjs.com/docs/runtime/varlock)).

That raised two product questions for ArkEnv × Nub:

1. Should ArkEnv ship a `nub-arkenv` bin so users can run `nub arkenv`
   instead of `nubx arkenv` / `npx arkenv`?
2. Should ArkEnv pursue a Varlock-parity Nub runtime hand-off so
   `env.ts` validates without an import (or ask Nub upstream to detect
   ArkEnv schemas the way it detects `.env.schema`)?

User-facing getting-started and framework guides keep stock runners
(`npx`, `node --env-file`, framework CLIs). Nub remains optional for
consumers; the [Use with Nub](../../apps/www/content/docs/guides/use-with-nub.mdx)
guide documents how the tools compose when a project already runs under
Nub. [ADR 0028](./0028-nextjs-no-next-env-hook.md) already rejected a
Varlock-style hijack of Next.js's `@next/env` pipeline.

## Decision

Do **not** ship a Nub CLI plugin, and do **not** pursue a Varlock-style
Nub runtime hand-off for ArkEnv.

1. **No `nub-arkenv` (or equivalent) bin.** `nubx arkenv` and
   `npx arkenv` already execute the published `arkenv` CLI. A plugin
   would only rename the verb. Public install/init copy stays on stock
   defaults; Nub is not a first-class product surface in getting-started.
2. **No invisible Nub → ArkEnv environment ownership.** ArkEnv's
   canonical surface remains `import { env } from "./env"` plus
   `arkenv check` and framework adapters. Validation on import,
   optional `nub.jsonc` `preload: ["./env.ts"]`, check in CI/scripts, and
   Vite/Bun/Next/Nuxt builds cover earlier-than-import needs without
   making ArkEnv a dotenv replacement inside Nub's runtime.
3. **Do not ask Nub to special-case `env.ts`.** A Varlock-parity hand-off
   would live in Nub core (schema detection + process ownership), not as
   something ArkEnv can publish as a plugin. Even if upstream offered it,
   it would fight the imported `env` object and the positioning against
   Varlock as an infrastructure/DSL orchestrator.

## Rejected alternatives

- **Ship `nub-arkenv` as a second bin on the `arkenv` package.** Near-zero
  implementation cost, near-zero user value vs `nubx arkenv`, and it
  implies special Nub behavior that does not exist.
- **Publish `@arkenv/nub-plugin` (or similar) as a runtime package.** Nub
  has no Vite-style plugin API for env validation; its plugin surface is
  CLI verb resolution only.
- **Varlock-style hand-off for `env.ts` (Nub detects ArkEnv and owns
  `process.env`).** Wrong product shape (invisible infra vs Typesafe
  import). Overlaps ADR 0028's reject of host-pipeline hijacks. Requires
  Nub-core changes ArkEnv cannot ship alone.
- **Document only, no ADR.** The guide's "What not to add" is enough for
  readers, but product rejects belong in `docs/adr/` so agents and
  future reviews find them on the decision trail (see
  [OUT-OF-SCOPE](../../.agents/skills/triage/OUT-OF-SCOPE.md)).

## Consequences

- Compose Nub + ArkEnv with existing surfaces: Nub loads `.env*`;
  ArkEnv validates via import, `preload`, `arkenv check`, and framework
  plugins. Document that in the Use with Nub guide; do not add packages.
- Future "should we integrate with Nub?" reviews start here and at
  ADR 0028 for the related Varlock-style Next reject.
- If Nub later exposes a stable, non-hijacking extension point that fits
  the imported `env` object, amend this ADR — do not silently add a
  plugin package.
