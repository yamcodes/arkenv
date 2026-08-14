---
"@arkenv/core": major
"@arkenv/standard": major
---

#### Rename `ArkEnvError` to `ArkEnvValidationError`

Catch `ArkEnvValidationError` when a schema fails and you need `.issues`. `ArkEnvError` is gone.

```ts
import arkenv, { ArkEnvValidationError } from "@arkenv/core";
// or: import { ArkEnvValidationError } from "@arkenv/standard";

try {
  arkenv({ PORT: "number.port" }, { env: { PORT: "abc" } });
} catch (error) {
  if (error instanceof ArkEnvValidationError) {
    console.error(error.issues);
  }
  throw error;
}
```

This class is validation-only. Reading a server-only key from client code still throws a native `Error` — do not catch that; move the read.

**BREAKING CHANGE**: Replace `ArkEnvError` with `ArkEnvValidationError` in imports and `instanceof` checks.

```diff
- import { ArkEnvError } from "@arkenv/core";
- if (error instanceof ArkEnvError) { /* .issues */ }
+ import { ArkEnvValidationError } from "@arkenv/core";
+ if (error instanceof ArkEnvValidationError) { /* .issues */ }
```
