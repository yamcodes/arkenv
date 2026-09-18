# Final v0 parity audit (RC)

Maintainer audit of `origin/dev` (v0) vs tip `v1` before the first
`1.0.0-rc.n` cut. Goal: confirm every v0 capability is either present on
v1, intentionally removed with a documented migration path, or parked as
a Not-GA known gap — not silently missing.

Verified against `origin/v1` tip after `#1848` (RC checklist) and
`#1840` (Vite startup validation). Evidence on this branch:
`pnpm typecheck` green; `vitest run` 1391+ passing (sandbox blocks
`git init` / `pnpm dpdm` in a handful of CLI tests — same suite is
green in CI on tip).

## Verdict

**Pass for RC.** No silent v0 regressions. Remaining differences are
documented breaking changes (migration guide + ADRs) or explicit
post-RC / Not-GA parks.

Public roadmap row: flip `ROADMAP_EXTRAS` id `parity-audit` to
`done: true` when this audit lands.

---

## Package map

| v0                                | v1                       | Parity                                   |
| --------------------------------- | ------------------------ | ---------------------------------------- |
| `arkenv` (runtime)                | `@arkenv/core`           | Rename + split                           |
| `arkenv/standard`                 | `@arkenv/standard`       | Split package                            |
| `@arkenv/cli`                     | `arkenv` (CLI)           | Rename; library import throws            |
| `@arkenv/vite-plugin`             | `@arkenv/vite-plugin`    | Transform-only (ADR 0021)                |
| `@arkenv/bun-plugin`              | `@arkenv/bun-plugin`     | Transform-only (ADR 0021)                |
| `@arkenv/nextjs` / `@arkenv/nuxt` | same names               | Flat path; strict engine gone (ADR 0020) |
| —                                 | `@arkenv/rsbuild-plugin` | v1 gain                                  |
| —                                 | `@arkenv/tanstack-addon` | v1 gain                                  |
| `@arkenv/build`, `fumadocs-ui`    | retained                 | Independent cadence (Discussion #1709)   |

Publishable packages on tip are still `1.0.0-alpha.*` under the `alpha`
npm tag until the RC channel flip (`docs/RC_CHECKLIST.md` §B).

---

## Runtime / API

| Capability                              | v0        | v1         | Notes                                                        |
| --------------------------------------- | --------- | ---------- | ------------------------------------------------------------ |
| ArkType `arkenv({ … })`                 | ✓         | ✓          | Via `@arkenv/core`                                           |
| Standard Schema (Zod / Valibot)         | ✓         | ✓          | Via `@arkenv/standard`                                       |
| `safe` / issues helpers                 | ✓         | ✓          | `@arkenv/core/safe`, `/issues`                               |
| Coercion + custom ArkType keywords      | ✓         | ✓          | Kept (Discussion #1709)                                      |
| Nested `{ server, client, shared }`     | ✓         | deprecated | Still works on Next/Nuxt; migrate to flat + `exposeToClient` |
| Strict layout engine / `--strict`       | ✓         | ✗          | Intentional hard cut (ADR 0020); two-module recipe in docs   |
| Canonical `import { env } from "./env"` | Next/Nuxt | all hosts  | ADR 0021                                                     |

Migration path:
[`apps/www/content/docs/guides/migrating-to-v1.mdx`](../../apps/www/content/docs/guides/migrating-to-v1.mdx).

---

## CLI

| Capability                               | v0 (`@arkenv/cli`) | v1 (`arkenv`) | Notes                                           |
| ---------------------------------------- | ------------------ | ------------- | ----------------------------------------------- |
| `init`                                   | ✓                  | ✓             | Hosting presets at scaffold time                |
| `check` (schema vs env)                  | —                  | ✓             | Runtime validation focus                        |
| `add` / `preset apply` / `preset remove` | ✓                  | ✗             | AST mutation removed (#1716 / Discussion #1709) |
| Dotenv formatting linter                 | ✓ (historical)     | ✗             | Pruned (#1717 / Discussion #1710)               |
| Library `import` from CLI pkg            | worked as runtime  | hard throw    | Points at `@arkenv/core`                        |

`init` still detects Vite (incl. TanStack Start), Next.js, Nuxt, Bun
fullstack, Rsbuild, and vanilla Node.

---

## Hosts / examples

| Host                     | v0 example / docs      | v1 example / docs                      | Parity                              |
| ------------------------ | ---------------------- | -------------------------------------- | ----------------------------------- |
| Plain Node / JS          | `basic`, `basic-js`    | same + `mix-and-match`                 | ✓                                   |
| Vite React               | `with-vite-react`      | + Zod twin                             | ✓                                   |
| Bun / Bun React          | ✓                      | ✓                                      | ✓                                   |
| Next.js                  | ✓ (+ strict)           | ✓ (flat; no strict example)            | Intentional                         |
| Nuxt                     | ✓                      | ✓                                      | ✓                                   |
| SolidStart               | ✓                      | ✓                                      | ✓ (now on env-object + vite plugin) |
| Zod / Valibot cookbooks  | ✓                      | ✓                                      | ✓                                   |
| Standard Schema cookbook | `with-standard-schema` | covered by `@arkenv/standard` examples | ✓                                   |
| TanStack Start (Vite)    | —                      | ✓ + docs                               | v1 gain                             |
| TanStack Start (Rsbuild) | —                      | ✓ + docs                               | v1 gain                             |

Framework docs on v1: Next.js, Nuxt, Vite, Bun, TanStack Start.

Playgrounds mirror the same set (`apps/playgrounds/*`), including
`vite-legacy` and `esbuild-cjs` for edge hosts.

---

## Intentional non-parity (not RC blockers)

Documented in ADRs / Discussions; do not reopen for the first RC:

1. **Schema-in-plugin / ambient `ImportMetaEnv` on Vite & Bun** — replaced by env-object transform (ADR 0021).
2. **Strict layout engine** — recipe only (ADR 0020).
3. **CLI AST preset mutation** — init presets + doc snippets (Discussion #1709).
4. **Custom dotenv style linter** — out of `arkenv check` (Discussion #1710).
5. **CJS dual-publish on core packages** — tip is ESM-only (`"type": "module"`, no `require` export). Parked under Discussion [#1750](https://github.com/yamcodes/arkenv/discussions/1750); not an RC gate unless promoted.
6. **Upstream TanStack CLI catalog** — [#1818](https://github.com/yamcodes/arkenv/issues/1818) blocked; community add-on URL still works.

---

## Test evidence (this cut)

- `pnpm typecheck` — green on the audit branch.
- CI on [#1850](https://github.com/yamcodes/arkenv/pull/1850) —
  `test`, `test-typesafety`, `test-build`, Vite compatibility matrix,
  and `test-e2e` all succeeded before merge.
- Local `vitest run` in the agent sandbox was incomplete (`git init` /
  `pnpm dpdm` denied); CI is the source of truth for the full suite
  (`docs/TESTING.md`).

`ROADMAP_EXTRAS` `parity-audit` was flipped to `done: true` with that CI
evidence.

---

## Residual Not-GA / announce gaps

Carry into RC Release notes (see `docs/RC_CHECKLIST.md` §A):

- Docs voice / AI-slop pass still owed (not an RC gate).
- ArkType ecosystem snippet still shows `import arkenv from "arkenv"` —
  soft blocker for announce / day-of `latest` → rc only.
- ESM-only decision (#1750) still open for post-RC product narrative.
- `#1819` TanStack Start guide overhaul and `#1807` blog draft are
  parked docs/marketing work, not API parity holes.
