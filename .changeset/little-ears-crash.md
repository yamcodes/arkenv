---
"arkenv": minor
---

#### `EnvSchema` type now always uses ArkEnv scope

The `EnvSchema` type has been simplified and fixed to include the ArkEnv scope.

Before:

```
export type EnvSchema<def, $ = {}> = type.validate<def, $>;
```

After:

```
export type EnvSchema<def> = type.validate<def, (typeof $)["t"]>; // (Whereas $ is the ArkEnv scope)
```

BREAKING CHANGE:

We no longer allow specifying a custom scope in the `EnvSchema` type.
