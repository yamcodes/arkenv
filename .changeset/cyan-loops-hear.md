---
"arkenv": minor
---

### Coercion

Introduced **Schema-Directed Coercion**: now, environment variables defined as `number` or `boolean` in your schema are automatically parsed to their correct types.

If you want to opt-out of this feature, pass `config.coerce: false` to `createEnv()` (`arkenv()`). Example:

```ts
arkenv(schema, { coerce: false });
```

To learn more about the new coercion system, read [the docs](https://arkenv.js.org/docs/arkenv/coercion).

* **BREAKING**: The `createEnv()` function signature has changed to support a configuration object.
  Instead of `createEnv(schema, env)`, use `createEnv(schema, config)` where `config` includes `env` (`process.env` by default, like before) and the newly added `coerce` option (`true` by default).
  For example, Vite users might need to update their `vite.config.ts`:
  ```ts
  const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), "") });
  ```
* **BREAKING**: The custom `boolean` morph has been removed. We now use `arktype`'s standard `boolean` instead, which is coerced when used within `createEnv` / `arkenv`. This is only breaking if you specifically use `boolean` unrelated to `createEnv` / `arkenv` / our plugins and expect it to be coerced.
* **BREAKING**: `number.port` is now a strict numeric refinement (0-65535). It no longer parses strings automatically outside of `createEnv` / `arkenv`. This is only breaking if you specifically use `port` unrelated to `createEnv` / `arkenv` / our plugins and expect it to be parsed as a number.
