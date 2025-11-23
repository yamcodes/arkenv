# @repo/types

Internal TypeScript types shared across ArkEnv packages.

## Purpose

This package provides common TypeScript types used internally by multiple packages in the ArkEnv monorepo. It eliminates code duplication and provides a single source of truth for shared type definitions.

## Usage

This package is **internal only** and is not published to npm. It's intended for use within the monorepo via workspace protocol:

```typescript
import type { InferType } from "@repo/types";
```

## Available Types

### `InferType<T>`

Extracts the inferred type from an ArkType type definition by checking its call signature. When a type definition is called, it returns either the validated value or `type.errors`.

## Important Notes

- **Not published**: This package is marked as `private: true` and will not be published to npm
- **Internal use only**: Do not depend on this package from external projects
- **Build step required**: This package requires a build step (`tsc`) to generate declaration files (`.d.ts`) in the `dist/` directory. This is necessary for tsdown's `dts.resolve` configuration to bundle types correctly into consuming packages
- **Workspace dependency**: Use `workspace:*` protocol when adding this as a dependency
- **Build order**: The internal types package must be built before packages that depend on it (Turborepo handles this automatically via `^build` dependencies)
