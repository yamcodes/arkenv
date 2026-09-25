---
"@arkenv/build": patch
---

#### Reject runtime validation keys in the plugin option guard

The shared transform-option guard now treats `coerce`, `onUndeclaredKey`, `arrayFormat`, `emptyAsUndefined`, `debugSecrets`, and `toJsonSchema` as unsupported plugin options. `env` stays a build-time override.
