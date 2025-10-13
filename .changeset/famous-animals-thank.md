---
"@arkenv/vite-plugin": patch
---

#### Support array defaults using `type().default()` syntax


Fix to an issue where `type("array[]").default(() => [...])` syntax was not accepted by the plugin due to overly restrictive type constraints. The plugin now accepts any string-keyed record while still maintaining type safety through ArkType's validation system.

##### New Features

-   Array defaults to empty using `type("string[]").default(() => [])` syntax
-   Support for complex array types with defaults
-   Mixed schemas combining string-based and type-based defaults

##### Example

```typescript
// vite.config.ts
import arkenv from "@arkenv/vite-plugin";
import { type } from "arkenv";

export default defineConfig({
  plugins: [
    arkenv({
      ALLOWED_ORIGINS: type("string[]").default(() => ["localhost"]),
      FEATURE_FLAGS: type("string[]").default(() => []),
      PORT: "number.port",
    }),
  ],
});
```

> [!NOTE]
> This is the same fix as in [`arkenv@0.7.2` (the core library)](https://github.com/yamcodes/arkenv/releases/tag/arkenv%400.7.2), but for the Vite plugin.