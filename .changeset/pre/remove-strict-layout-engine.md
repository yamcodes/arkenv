---
"arkenv": major
"@arkenv/build": major
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
"@arkenv/agent-plugin": major
---

#### Remove the dedicated strict layout engine

Flat `env.ts` is now the only first-class path ([ADR 0020](https://github.com/yamcodes/arkenv/blob/v1/docs/adr/0020-strict-layout-complexity-budget.md)). Scaffolding no longer asks for layout; `--strict` / `--simple` are unknown arguments. `resolveLayout` no longer auto-detects `env/client.ts` + `env/server.ts`, and `package.json` `"arkenv.layout"` is gone. `@arkenv/nextjs` and `@arkenv/nuxt` no longer export `/client`, `/server`, or Standard Schema twins; auto-extend (`#arkenv/client-env`) and Vite/Bun/Nuxt compile-time server-schema import blockers are removed. Presets target a single flat schema file (no `:client` / `:server` markers).

Name/type isolation is a documented two-module recipe: two imports, optional `extends: [clientEnv]`. On Next, the server module can use `@arkenv/core` plus optional `import "server-only"`. On Nuxt, never import the server module from client code. Flat-layout value safety (prefixes, proxy, client transform, Next conditional exports on the single `env.ts`) is unchanged.

**BREAKING CHANGE:** Remove first-class strict layout.

Migration for prior `--strict` users:

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
import { env as clientEnv } from "./client";

export const env = arkenv(
  {
    DATABASE_URL: "string",
  },
  {
    extends: [clientEnv],
  },
);
```

See [Client vs server](https://arkenv.js.org/docs/validating-your-environment/client-vs-server) and the alpha hard-cut section in [Migrating to v1](https://arkenv.js.org/docs/guides/migrating-to-v1).
