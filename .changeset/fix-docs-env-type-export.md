---
"arkenv": patch
---

#### Use `Dict<string>` for the `env` option type

Replace the public `RuntimeEnvironment` type alias with the internal `Dict<string>` type (`Record<string, string | undefined>`) for the `env` option in `createEnv`. This removes a redundant public export and lets the documentation generator resolve the type correctly without falling back to `any`.
