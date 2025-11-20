---
"@arkenv/vite-plugin": patch
"arkenv": patch
---

#### Support type definitions for schema reuse

`arkenv()` and `@arkenv/vite-plugin` now accept both raw schema objects and type definitions created with ArkType's `type()` function. This allows you to define your schema once and reuse it across your application, which is especially useful for multi-runtime setups like Vite where you need the same schema in both `vite.config.ts` and client code.

```ts
import arkenv, { type } from 'arkenv';

// Define schema once
const Env = type({
  PORT: "number.port",
  HOST: "string.host",
});

// Reuse it in multiple places
const configEnv = arkenv(Env, process.env);
const testEnv = arkenv(Env, { PORT: "3000", HOST: "localhost" });
```
