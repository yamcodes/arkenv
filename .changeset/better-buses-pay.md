---
"arkenv": minor
---

Rename from `ark.env` to `arkenv`

BREAKING CHANGE:

Package renamed from `ark.env` to `arkenv`, main export renamed from `env` to `defineEnv`.

Before:
```ts
import ark, { host, port } from "ark.env";
const env = ark.env({
  HOST: host,
  PORT: port,
});
```

After:
```ts
import { defineEnv, host, port } from "arkenv";
const env = defineEnv({
  HOST: host,
  PORT: port,
});
```
