---
"@arkenv/standard": minor
"@arkenv/core": minor
---

#### Add optional `toJsonSchema` coercion escape hatch

`@arkenv/standard` gains an optional `toJsonSchema` config callback used as a **fallback** after built-in Standard JSON Schema probes fail for a key. This lets Valibot users wire `@valibot/to-json-schema` once and get ArkEnv pre-coercion for `v.number()` / `v.boolean()` without per-key wrappers.

- Return a plain object to coerce that key; return `undefined` to skip only that key
- Throwing or returning a non-plain object fails the parse with `ArkEnvError` (`INVALID_SCHEMA`) for that key
- Zod and other Standard JSON Schema validators are unchanged (callback is not invoked when probes succeed)
- No new package dependencies on `@arkenv/standard`
