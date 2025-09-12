---
"arkenv": minor
---

`createEnv` signature simplified

The `createEnv` function now has a simpler signature:
- No longer uses multiple overloads. Return type now always uses the ArkEnv scope


BREAKING CHANGE:

You can no longer rely on `EnvSchema` to type `createEnv` with a custom scope. Only the ArkEnv scope is supported.
