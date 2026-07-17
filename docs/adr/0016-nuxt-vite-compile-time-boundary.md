# ADR 0016: Nuxt strict-layout compile-time boundary via Vite plugin

## Status

Accepted

## Context

To decide how `@arkenv/nuxt` enforces compile-time isolation between server and client schemas in the strict layout, preventing server-only environment files from being imported into browser bundles.

Nuxt applications can run code in two distinct contexts:

1. **Server-side** (server routes, middleware, Nitro) must be able to read server-only secrets such as `DATABASE_URL`.
2. **Client-side** (Vue components, browser entry points) must only access public variables (client and shared keys).

The **simple layout** relies on a runtime proxy to throw when a server-only key is read on the client. This is sufficient for most teams, but it does not provide compile-time guarantees: a developer can still import the full `env` object into a client file and ship server variable *names*, *types*, and *validation logic* to the browser.

The **strict layout** separates schemas into `env/client.ts` and `env/server.ts`. To make this separation meaningful, importing `~/env/server` (or any file ending with `/server` inside the schema directory) from a client module must be impossible. Nuxt does not provide a built-in equivalent to Next.js's `react-server` / `server-only` package semantics, so `@arkenv/nuxt` needs its own enforcement mechanism.

We evaluated two approaches:

- **Option 1: Runtime proxy only (rejected for strict layout).** Continue relying on the runtime proxy even in strict layout. This preserves a single runtime mechanism, but it allows client modules to import server schema files, meaning server validation logic and variable metadata still ship to the browser. That violates the strict layout's promise.
- **Option 2: Custom Vite plugin that blocks client-side imports (chosen).** Register a Vite plugin inside `@arkenv/nuxt/module` that intercepts module resolution during the client build. If any client-side module attempts to resolve `@arkenv/nuxt/server` or a `/server` file inside the configured schema directory, the plugin throws a compile-time error and fails the build.

## Decision

We adopt **Option 2**: the strict layout's compile-time boundary is enforced by a Vite plugin registered by `@arkenv/nuxt/module`.

1. **Build-time interception.** The plugin runs during Nuxt's Vite bundling phase. It watches module resolution requests that originate from the client graph.
2. **Targeted blocklist.** It blocks imports of `@arkenv/nuxt/server` and any userland file whose path ends with `/server` within the configured `schemaPath` directory (e.g., `env/server.ts`).
3. **Immediate failure.** When a blocked import is detected, the build fails with a descriptive error before any client bundle is produced.
4. **No runtime overhead.** Because the check happens at build time, there is no extra runtime code or proxy cost in the strict layout beyond the existing validation layer.

## Consequences

- **Compile-time guarantee in strict layout.** Server-only schemas cannot accidentally ship to the browser via a wrong import.
- **Simple layout behavior is unchanged.** The simple layout continues to use the runtime proxy as its only boundary, keeping its single-file DX.
- **Plugin maintenance.** The Vite plugin must stay aligned with Nuxt's module/Vite API and the strict layout's file conventions.
- **User documentation stays focused.** The exact plugin mechanics, error strings, and file-resolution interception details are recorded here rather than in the FAQ or layout guides, which can describe the guarantee in user-facing terms.
