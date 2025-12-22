---
"arkenv": minor
---

### Coercion

Introduced **Schema-Directed Coercion**: now, environment variables defined as `number` or `boolean` in your schema are automatically parsed to their correct types.

* **Automatic Coercion**: Environment variables defined as `number` or `boolean` in your schema are now automatically coerced from strings.
* **Standard-Based**: Uses standard JSON Schema introspection (`.toJsonSchema()`) to identify coercion targets safely and reliably.
* **Performance**: Optimized traversal ensures high-performance processing without internal mutations.

If you want to opt-out of this feature, pass `config.coerce: false` to `createEnv()` (`arkenv()`). Example:

```ts
arkenv(schema, { coerce: false });
```

To learn more about the new coercion system, read [the docs](https://arkenv.js.org/docs/arkenv/coercion).

### ⚠️ Breaking Changes

* **`createEnv` API**: The `createEnv` function signature has changed to support a configuration object.
  Instead of `createEnv(schema, env)`, use `createEnv(schema, config)` where `config` includes `env` and the newly added `coerce` option (`true` by default).
* **`boolean` keyword**: The custom `boolean` morph has been removed. Use `arktype`'s standard `boolean` instead, which will be coerced when used within `createEnv` / `arkenv`.
* **`port` keyword**: Now a strict numeric refinement (0-65535). It no longer parses strings automatically outside of `createEnv` / `arkenv`.

If your only usage of these types was inside `createEnv` / `arkenv`, or following the official Bun / Vite plugin examples, you should not be affected by these changes.
