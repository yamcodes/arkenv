# ADR 0034: No Next.js runtime public-env global

## Status

Accepted

## Context

`@arkenv/nextjs` exported `<ArkEnvScript />`, which serialized
`NEXT_PUBLIC_*` into `globalThis.__arkenv_env__` during SSR. Codegen
`runtimeEnv` preferred that global on the client so containers could
override build-time public values without a rebuild.

The component lived only in the changelog. Public Next docs taught
prefixes, proxy, and `withArkEnv` codegen — not the script. That is the
same class of semi-public surface as the removed CLI `package.json`
`"arkenv"` pointer ([#1906](https://github.com/yamcodes/arkenv/issues/1906)
/ [ADR 0033](0033-cli-schema-location-no-package-json.md)): agents and
humans invent it as required Next setup.

Next.js documents `NEXT_PUBLIC_*` as build-time. Nuxt’s no-rebuild public
env rides Nitro `runtimeConfig` (host-native). A bespoke browser global
fights Next’s compiler and taxes every user with a dual-transport
codegen lookup.

Hat evaluation:
[docs/design/arkenvscript-nextjs-runtime-public-env.md](../design/arkenvscript-nextjs-runtime-public-env.md)
([#1911](https://github.com/yamcodes/arkenv/issues/1911)).

## Decision

1. **Remove** `ArkEnvScript` / `ArkEnvScriptProps` from `@arkenv/nextjs`
   (root and `react-server` entries).
2. **Stop reading** `globalThis.__arkenv_env__` in runtime merge and in
   codegen. Generated `runtimeEnv` lines are `KEY: process.env.KEY` so
   Next can inline `NEXT_PUBLIC_*`.
3. **Keep** ADR 0005 `runtimeEnv` as the sole client value channel for
   codegen — build-time inlining only.
4. **Document** the Docker story: bake public values at build, pass
   dynamic public config from the server as props, and point
   no-rebuild client injection at dedicated ecosystem tools (for example
   `next-runtime-env`). See
   [Next.js and Docker](../../apps/www/content/docs/guides/nextjs-docker.mdx).

## Rejected alternatives

- **Document and keep as happy path or advanced hatch.** Real Docker
  demand, but locks a Next-fighting transport into the v1 lifecycle,
  dual-teaches the frameworks matrix, and keeps an agent footgun.
- **Extract `@arkenv/nextjs-runtime-env` now.** Same product commitment
  under another name. Reopen post-1.0 only if demand is proven and
  ecosystem libs are insufficient.
- **Leave undocumented.** The bug this ADR closes.

## Consequences

- Changing `NEXT_PUBLIC_*` for a container deploy requires a rebuild (or
  a different image tag), matching Next.js and the frameworks matrix.
- Truly dynamic public config belongs on server-only keys passed as
  props, or on a dedicated third-party runtime injector outside ArkEnv
  support.
- [ADR 0005](0005-nextjs-runtime-env.md) still owns typed `runtimeEnv`
  destructuring; this record owns the **absence** of a runtime global
  override. [ADR 0028](0028-nextjs-no-next-env-hook.md) remains: do not
  fight Next’s env pipeline.
