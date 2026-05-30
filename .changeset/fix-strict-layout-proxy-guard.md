---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Fix strict-layout rerun safety, shared-key leakage, and Proxy prototype guard

**`@arkenv/cli`** — Re-running `arkenv init` on a project already scaffolded in the strict Next.js layout (`env.shared.ts`, `env.client.ts`, `env.server.ts`) no longer silently overwrites files without asking. The CLI now checks all three variant paths before building the `existingFiles` list passed to the planner, so each file is correctly identified as an `overwrite` rather than a fresh `create`.

**`@arkenv/nextjs`** — Fix two issues with the Proxy-wrapped env object:

1. Raw schemas extended through the server entrypoint (`@arkenv/nextjs/server`) were incorrectly classified as server-only, causing keys like `NODE_ENV` from a shared schema to throw when accessed on the client. Keys are now only added to `serverOnlyKeys` when they are not `NEXT_PUBLIC_`-prefixed and the current context is not `isShared`.

2. The typo-guard Proxy blocked standard `Object.prototype` methods (`hasOwnProperty`, `isPrototypeOf`, `propertyIsEnumerable`, etc.) and all symbol properties. The guard now defers to `Object.prototype` membership instead of an incomplete string allowlist, and symbol properties (`Symbol.iterator`, `Symbol.toStringTag`, etc.) are always forwarded without a check.
