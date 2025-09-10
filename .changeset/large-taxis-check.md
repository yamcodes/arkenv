---
"arkenv": minor
---

#### Expose `type` function

ArkEnv now exposes a `type` function with built-in ArkEnv scope, providing access to environment-specific types like `string.host` and `number.port`.

```ts
import { type } from "arkenv";

const env = type({
  NODE_ENV: "string",
  HOST: "string.host",
  PORT: "number.port",
});

const result = env.assert({
  NODE_ENV: "development",
  HOST: "localhost", 
  PORT: "3000",
});
```

This extends ArkType's `type` function with ArkEnv-specific validations for common environment variable patterns.
