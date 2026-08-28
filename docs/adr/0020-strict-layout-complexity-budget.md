# ADR 0020: Strict layout is a security boundary with a complexity budget

Name/type isolation is a documented two-module recipe, not a first-class layout engine. Flat `env.ts` is the only scaffolded path. Secret **values** stay off the client via prefixes, proxy, and client transform; hiding **names and types** is user-land import-graph discipline.

## Status

Accepted (amended 2026-08-28; [#1634](https://github.com/yamcodes/arkenv/issues/1634))

The original decision kept dedicated strict layout as a minority product path with a complexity budget. That standing decision is replaced below. Filename and number are unchanged.

## Context & problem

To decide how much DX investment ArkEnv puts into the strict (split-file) layout versus the flat/simple layout — and which classes of strict-mode features are in or out of scope.

Flat/simple layout is the default and the best DX: one schema file, API aligned with core `@arkenv/core`, and (on Next.js) codegen that removes `runtimeEnv` boilerplate so the experience can match non-Next hosts.

When client and server schemas live in one module, server variable *names*, *types*, and validation logic can ship in the client bundle. T3 Env solves that with two `createEnv()` calls and two import sites — no layout detector, no `/server` package entry, no bundler plugin that fails the build if you import the server file. Accidental client import of a server module is user error; Next users can add `import "server-only"` themselves.

ArkEnv built a **layout engine** on top of that idea: CLI `--strict` / wizard, `resolveLayout`, `@arkenv/nextjs/server` and `/client` (and Nuxt / Standard Schema twins), `#arkenv/client-env` auto-extend, role-suffixed presets, Vite/Bun/Nuxt compile-time import blocking, and docs that treated strict as co-equal to flat.

That is ongoing cost across CLI, four integrations, presets, and docs. The security **value** (secret **values** stay off the client) is already the flat path: prefixes + proxy / client transform ([ADR 0015](./0015-nextjs-conditional-exports-boundary.md), [ADR 0021](./0021-env-object-canonical-surface.md)). Dedicated strict only hid names and types from the client module graph — a minority requirement T3 treats as a recipe.

`@arkenv/nextjs/server` is not required for that recipe. It exists to bake `server-only`, auto-extend the client env, and expose unconditional full types. The root `@arkenv/nextjs` entry is the wrong import for a split **server** file: published types are the client surface (`NEXT_PUBLIC_*` only) via ADR 0015, which is the **single** `env.ts` story. A server-only module should use `@arkenv/core` (types always complete).

Related work crystallised the tension:

- [#1304](https://github.com/yamcodes/arkenv/issues/1304) proposed an in-tree `server.gen.ts` factory for Next strict layout.
- [#1307](https://github.com/yamcodes/arkenv/issues/1307) / [#1401](https://github.com/yamcodes/arkenv/pull/1401) gave Nuxt server DX via `#arkenv/client-env` and auto-extend on `@arkenv/nuxt/server`.
- [#1402](https://github.com/yamcodes/arkenv/issues/1402) explored virtual codegen so `env/` stays user-authored only (closed via the `@/.arkenv` factory track; not a reason to keep a strict-layout factory).

## Prior decision

Keep dedicated strict layout. Do not make every flat affordance available under it at equal cost. Improve strict DX only when cheap and caused by the boundary (Next `runtimeEnv` help, Nuxt auto-extend, `internal/shared.ts` as a privacy guardrail). Reject a generated server factory whose only job is `extends: [clientEnv]`. Governor = cost. Keep user-facing `env/` small.

That posture still treated compile-time schema isolation as a product promise and justified `/client`+`/server`, auto-extend, and import blockers.

## Decision

1. **Lock the recipe.** Drop first-class strict layout. Name/type isolation is a documented advanced recipe in the T3 shape: two modules, two import paths, no `layout: "strict"`.
2. **Flat remains the only first-class path.** Scaffold and happy-path docs teach one `env.ts` and `import { env } from "./env"`. Keep `@arkenv/nextjs` `react-server` / `default` conditional exports and `withArkEnv` codegen for that file. Do not change flat-layout prefix / proxy / transform security.
3. **Hard removal in v1 alpha**, not hide-then-delete. Alpha is the window for structural cuts. Alpha `--strict` users get a short release-note snippet; they opted into instability.
4. **Next and Nuxt are the same cut.** Drop `/client` and `/server` (and Standard Schema twins) on both. Do **not** leave a Nuxt-only Vite resolve hook as residual layout engine. ArkEnv validates environment variables; it does not police framework bundler graphs. Nuxt has no `server-only` analogue; that is acceptable. Teaching line: never import the server module from client code.
5. **Two import paths are an explicit exception** to canonical `./env` for the split recipe. Do not auto-merge. Magic merging is the debt being removed.
6. **Value safety is module-scoped.** Prefix/proxy/transform protect the env module the plugin rewrites (or the Nuxt proxy / `runtimeConfig.public` payload). They do **not** make an untransformed `@arkenv/core` server file safe to import from the client graph. SSR serialization of that object is user error, same as T3.

Recipe shape (illustrative, not a file-path contract):

```ts
// client module — withArkEnv / plugin schemaPath points here
import arkenv from "@/.arkenv";

export const env = arkenv({
  NEXT_PUBLIC_API_URL: "string",
});
```

```ts
// server module
import "server-only"; // optional; Next’s package, not ArkEnv’s
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
});
```

Vite/Bun: plugin `schemaPath` is the client module; the server module is core and is not imported from client code. `extends: [clientEnv]` is optional.

If auto-detect of `env/client.ts` + `env/server.ts` stayed, those filenames would still be a dedicated layout. A recipe only stays a recipe if that protocol goes away.

## Consequences

- **Remove with the follow-up implementation issue** (not from RFC #1634): `arkenv init --strict` / wizard layout / leftover `--simple`; `resolveLayout` `"strict"` and `layout: "strict"`; Next/Nuxt `/server`+`/client` and Standard Schema twins; auto-extend (`#arkenv/client-env`, omitted `extends`); `internal/shared.ts` as a product convention; Vite/Bun/Nuxt compile-time import blockers; preset `:client` / `:server` markers; comparison copy that sells `--strict`; blessed `with-nextjs-strict` / nextjs-strict playground.
- **[#1304](https://github.com/yamcodes/arkenv/issues/1304)** remains superseded (in-tree server factory).
- **[#1402](https://github.com/yamcodes/arkenv/issues/1402)** stays closed as superseded for strict `env/`; do not revive a strict-layout factory.
- **[ADR 0016](./0016-nuxt-vite-compile-time-boundary.md)** is superseded: no Nuxt (or Vite/Bun) compile-time import blocker.
- **[ADR 0019](./0019-framework-subpath-exports.md)** is amended: default entry stays; `./client` and `./server` come out with the layout engine. `./shared` remains gone.
- **[ADR 0013](./0013-flat-layout-codegen-type-strategy.md)**, **[ADR 0015](./0015-nextjs-conditional-exports-boundary.md)**, **[ADR 0021](./0021-env-object-canonical-surface.md)**, **[ADR 0028](./0028-nextjs-no-next-env-hook.md)**: name/type hiding is the recipe, not dedicated strict layout or a compiler hook. Flat value isolation is unchanged.
- **Docs** teach one `env.ts`. The split recipe is one advanced page. Exact Nuxt warning copy is docs on the implementation issue, not a blocker for this record.
- **Do not** re-introduce `server:` / `client:` bags on the core API.
