# Design: Bun Plugin Validator Mode Support

## Problem
The Bun plugin needs to support the `validator: "standard"` mode to allow users to build projects without an `arktype` dependency.

## Implementation Details

### 1. Plugin Signature
We will update the `arkenv` function in `packages/bun-plugin/src/plugin.ts`:

```typescript
export function arkenv(
  options: CompiledEnvSchema,
  arkenvConfig?: ArkEnvConfig,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
  options: EnvSchema<T>,
  arkenvConfig?: ArkEnvConfig,
): BunPlugin;
export function arkenv<const T extends SchemaShape>(
  options: EnvSchema<T> | CompiledEnvSchema,
  arkenvConfig?: ArkEnvConfig,
): BunPlugin {
  const envMap = processEnvSchema<T>(options, arkenvConfig);
  // ...
}
```

### 2. Update processEnvSchema Utility
The `processEnvSchema` function in `packages/bun-plugin/src/utils.ts` will be updated to accept and pass through the config:

```typescript
export function processEnvSchema<T extends SchemaShape>(
  options: EnvSchema<T> | CompiledEnvSchema,
  config?: ArkEnvConfig,
): Map<string, string> {
  const env: SchemaShape = createEnv(options as any, {
    ...config,
    env: process.env,
  });
  // ... rest of the function
}
```

### 3. Hybrid Mode Consideration
The `hybrid` export (zero-config mode) will continue to work without config, defaulting to ArkType mode. Users who want Standard Schema support must use the function call syntax.

### 4. Bun Config Support
Users will be able to configure it like this:

```ts
import { z } from 'zod'
import arkenv from '@arkenv/bun-plugin'

Bun.build({
  plugins: [
    arkenv({
      BUN_PUBLIC_API_URL: z.string().url()
    }, {
      validator: 'standard'
    })
  ]
})
```

By passing `validator: 'standard'`, `createEnv` will skip the dynamic loading of ArkType, thus avoiding the `MODULE_NOT_FOUND` error.

## Differences from Vite Plugin
- The Bun plugin uses `processEnvSchema` utility instead of inline `createEnv` call
- The Bun plugin has a `hybrid` export for zero-config usage (which won't support config parameter)
- The Bun plugin uses `BUN_PUBLIC_` prefix instead of `VITE_`
