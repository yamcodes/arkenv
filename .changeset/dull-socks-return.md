---
"arkenv": minor
---

## Improved type inference and scope-based validation

The `createEnv` function got a facelift with better TypeScript inference and introduced a new scope-based validation system.

**Key improvements:**

- **Better ecosystem integration**: Use `string.host` and `number.port` in your schemas, as if they were native ArkType keywords
- **Cleaner API**: No need to awkwardly import `host` and `port` types anymore

### Before:

`host` and `port` had to be manually imported from the `arkenv` package, and used as arguments to the `createEnv` function.

```ts
import { createEnv, host, port } from "arkenv";

const env = createEnv({
  HOST: host,    // Validates IP addresses or "localhost"
  PORT: port,    // Validates port numbers (0-65535)
  NODE_ENV: "string",     // Standard string validation
});
```

### After:

Now you can use `string.host` and `number.port` in your schemas, in a way that is much more natural and idiomatic within the ArkType ecosystem.

```ts
import { createEnv } from "arkenv";

const env = createEnv({
  HOST: "string.host",    // Validates IP addresses or "localhost"
  PORT: "number.port",    // Validates port numbers (0-65535)
  NODE_ENV: "string",     // Standard string validation
});
```

### BREAKING CHANGE:

- We are no longer exporting `host` and `port` types. Use `string.host` and `number.port` instead.