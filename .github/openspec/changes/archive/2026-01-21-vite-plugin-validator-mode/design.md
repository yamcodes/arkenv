# Design: Vite Plugin Validator Mode Support

## Problem
The Vite plugin needs to support the `validator: "standard"` mode to allow users to build projects without an `arktype` dependency.

## Implementation Details

### 1. Plugin signature
We will update the `arkenv` function in `packages/vite-plugin/src/index.ts`:

```typescript
export default function arkenv<const T extends SchemaShape>(
  schema: EnvSchema<T> | CompiledEnvSchema,
  config?: ArkEnvConfig
): Plugin {
  // ...
  const env = createEnv<T>(schema, {
    ...config, // Pass through user config
    env: loadEnv(mode, envDir, ""),
  });
  // ...
}
```

### 2. Standard Schema Type Inference
To ensure types like `import.meta.env.VITE_API_URL` are correctly inferred from Zod/Valibot schemas, we must update `packages/internal/types/src/infer-type.ts`.

It should check if the schema satisfies `StandardSchemaV1` before attempting ArkType-specific inference.

### 3. Vite Config Support
Users will be able to configure it like this:

```ts
import { z } from 'zod'
import arkenv from '@arkenv/vite-plugin'

export default defineConfig({
  plugins: [
    arkenv({
      VITE_API_URL: z.url()
    }, {
      validator: 'standard'
    })
  ]
})
```

By passing `validator: 'standard'`, `createEnv` will skip the dynamic loading of ArkType, thus avoiding the `MODULE_NOT_FOUND` error.
