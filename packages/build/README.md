# @arkenv/build

> **Internal Package — Not for direct use.**

This package is published to npm solely to support the ArkEnv framework plugins (`@arkenv/nextjs`, `@arkenv/nuxt`, etc.). It contains build-time utilities that are not suitable for runtime or Edge environments.

## What it does

- **Layout resolution:** Detects simple vs. strict multi-file schema layouts.
- **Key extraction:** Statically parses schema files to extract environment variable keys without executing them.
- **File watching:** Watches schema files during development and triggers codegen.

## Why it exists

Build-time tools require Node-native modules (`fs`, `path`) and heavy dependencies (`chokidar`). These cannot be inlined into the runtime bundles of framework plugins without breaking Edge runtime compatibility (Vercel, Cloudflare Workers). A published package is the only way to share this logic across plugins while keeping the core `arkenv` runtime 100% dependency-free.

## Stability

The API surface of `@arkenv/build` is **unstable** and may change without a major version bump. Do not depend on it directly in your application. It is an implementation detail of the official ArkEnv framework integrations.

## Related

- [ADR 0009: Shared Build Package](../../docs/adr/0009-shared-build-package.md)
- [ADR 0011: Runtime Shared Logic Strategy](../../docs/adr/0011-runtime-shared-logic-strategy.md)
