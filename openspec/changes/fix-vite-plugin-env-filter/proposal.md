# Change: Fix Vite Plugin Server-Only Env Vars Leak to Client

## Why

The Vite plugin currently exposes **all** environment variables from the schema to client code, including server-only variables like `PORT`. This is a security risk because sensitive server-side configuration (database URLs, API keys, ports, etc.) can be accidentally exposed to the client bundle.

**Related Issue**: [#385](https://github.com/yamcodes/arkenv/issues/385)

### Current Behavior

In `apps/playgrounds/vite/vite.config.ts`, a single schema `Env` is reused for both:
1. Server-side validation (via `arkenv(Env, loadEnv(...))`)
2. Client-side exposure (via `arkenvVitePlugin(Env)`)

The schema includes:
- `PORT` (server-only, unprefixed)
- `VITE_MY_VAR`, `VITE_MY_NUMBER`, `VITE_MY_BOOLEAN` (client-safe, prefixed)

However, the plugin implementation in `packages/vite-plugin/src/index.ts` exposes **every key** in the schema (including `PORT`) as `import.meta.env.*` in the client bundle, not just the `VITE_*` ones.

### Impact

- **Security risk**: Server-only variables (like `PORT`, database URLs, API keys, etc.) can be accidentally exposed to client code
- **Misleading documentation**: The comment in `vite.config.ts` says unprefixed variables are "server-only and not exposed to client code", but this is not true
- **User confusion**: Users following the example pattern may accidentally expose sensitive variables in production

## What Changes

- **MODIFIED**: The Vite plugin will automatically filter environment variables to only expose those with the configured Vite prefix (defaults to `VITE_`)
- **MODIFIED**: The plugin will respect Vite's `envPrefix` configuration option
- **MODIFIED**: Only environment variables matching the prefix will be exposed to client code via `import.meta.env.*`
- **MODIFIED**: Documentation and examples will be updated to reflect this behavior

## Impact

- **Affected specs**: `vite-plugin` (new capability spec)
- **Affected code**: 
  - `packages/vite-plugin/src/index.ts` - Plugin implementation
  - `apps/playgrounds/vite/vite.config.ts` - Example usage
  - Documentation files referencing the plugin behavior
- **Breaking changes**: None - this is a security fix that makes the plugin safer by default

