---
"arkenv": minor
---

### Coercion

Introduced **Schema-Directed Coercion**, a new system for handling environment variable non-strings: now, environment variables defined as `number` or `boolean` in your schema are automatically coerced from strings.

To learn more about the new coercion system, read [the docs](https://arkenv.js.org/docs/arkenv/coercion).

### ⚠️ Breaking Changes

* **`boolean` keyword**: The custom `boolean` morph has been removed. Use `arktype`'s standard `boolean` instead, which will be coerced when used within `createEnv` / `arkenv`.
* **`port` keyword**: Now a strict numeric refinement (0-65535). It no longer parses strings automatically outside of `createEnv` / `arkenv`.

If your only usage of these types was inside `createEnv` / `arkenv`, or following the official Bun / Vite plugin examples, you should not be affected by these changes.
