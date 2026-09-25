---
"@arkenv/build": patch
---

#### Reject runtime keys in the plugin option guard

The shared transform-option guard now treats `env`, `coerce`, `onUndeclaredKey`, `arrayFormat`, `emptyAsUndefined`, `debugSecrets`, and `toJsonSchema` as unsupported plugin options. The build reads the loaded environment.
