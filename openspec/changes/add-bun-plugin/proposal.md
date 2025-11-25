# Change: Add Bun Plugin for ArkEnv

## Why

ArkEnv currently provides a Vite plugin for build-time environment variable validation and type-safe access in client code. However, Bun users (especially those building full-stack React applications with Bun's `serve` function) need similar functionality.

Bun's bundler statically replaces `process.env` variables during build, which means:
- Environment variables must be validated and transformed at build-time
- Only variables matching Bun's prefix (defaults to `BUN_PUBLIC_*`) should be exposed to client code
- Type augmentation is needed for type-safe access to `process.env` in client code
- The plugin must work within Bun's serve function for full-stack React apps

Without a Bun plugin, users must manually validate environment variables or risk runtime errors, and they lose the type safety and build-time validation benefits that ArkEnv provides.

## What Changes

- **ADDED**: New `@arkenv/bun-plugin` package that provides Bun plugin integration
- **ADDED**: Build-time environment variable validation using Bun's plugin API
- **ADDED**: Automatic filtering of environment variables based on Bun's prefix (defaults to `BUN_PUBLIC_*`)
- **ADDED**: Static replacement of `process.env` variables with validated, transformed values during bundling
- **ADDED**: Type augmentation for `process.env` similar to Vite plugin's `ImportMetaEnvAugmented`
- **ADDED**: Support for Bun's serve function in full-stack React applications
- **ADDED**: Documentation and examples for using the Bun plugin

The plugin will work very similarly to the Vite plugin:
- Uses Bun's `onLoad` hook to intercept and transform environment variable access
- Validates environment variables using ArkEnv's schema validation
- Filters variables to only expose those matching the configured prefix
- Replaces `process.env.VARIABLE` with validated, transformed values (e.g., string to boolean, default values)
- Provides TypeScript type augmentation for type-safe access

## Impact

- **Affected specs**: New capability `bun-plugin`
- **Affected code**:
  - New package: `packages/bun-plugin/` (or similar structure)
  - Documentation files (README, docs)
  - Example Bun React playground updates
  - Type augmentation utilities (similar to `packages/vite-plugin/src/types.ts`)
- **User-facing**: Bun users can now validate environment variables at build-time with full type safety, similar to Vite users

## References

- [Bun Plugin API Documentation](https://bun.com/docs/bundler/plugins) - Official Bun plugin API reference
- Existing Vite plugin implementation (`packages/vite-plugin/`) - Reference for similar functionality
- Bun React playground (`apps/playgrounds/bun-react/`) - Target environment for testing

