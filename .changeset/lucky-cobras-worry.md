---
"arkenv": patch
---

#### Fix inline schema autocompletion

Fixed a regression where editor autocompletion for ArkType DSL strings (e.g. `"string"`, `"number.port"`) stopped working when using `arkenv()` with an inline schema object. The `createEnv` overloads are now narrowed by `validator` config type, making them mutually exclusive and order-independent.