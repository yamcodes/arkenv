---
"arkenv": patch
---

#### Fix coercion to prevent in-place mutation of environment config objects

Refactor `applyCoercion` to perform non-mutating updates on environment configuration data. Clone objects and arrays along the validation path instead of modifying them in-place, preventing runtime crashes on frozen configuration objects (e.g., framework runtime configurations) and avoiding side-effects on reusable config objects.

Usage:

```ts
import { createEnv } from "arkenv";

const env = createEnv(
  { DATABASE: { port: "number" } },
  { env: { DATABASE: Object.freeze({ port: "3000" }) } } // Frozen object is now safely parsed without crashes!
);
```
