---
"arkenv": patch
---

#### ArkType is now optional


ArkEnv now supports an explicit `validator` option.

- **`validator: "arktype"` (default)**

  Uses ArkType for validation and coercion. Requires `arktype` to be installed.  
  This is the **full ArkEnv feature set** and the recommended mode.

- **`validator: "standard"`**

  Uses Standard Schema validators directly (e.g. Zod, Valibot).  
  Works **without ArkType installed** and provides a minimal runtime path.

```ts
arkenv(schema, { validator: "arktype" | "standard" })
```

This change is fully backward compatible.
Existing code continues to use ArkType by default.

📖 See the docs for detailed behavior and examples!
