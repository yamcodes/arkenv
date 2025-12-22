---
"@arkenv/vite-plugin": minor
---

### Breaking Change: `createEnv` API Update

The underlying `arkenv` package has updated its `createEnv` API. This affects users who manually call `arkenv` (or `createEnv`) within their `vite.config.ts` to Type-Safe environment variables during config loading.

If you are using this pattern:

```ts
const env = arkenv(Env, loadEnv(mode, process.cwd(), ""));
```

You must update it to:

```ts
const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), "") });
```

The plugin usage itself (`plugins: [arkenv(Env)]`) remains unchanged.
