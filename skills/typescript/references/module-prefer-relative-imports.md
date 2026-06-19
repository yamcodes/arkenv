# Prefer Relative Imports for Local Directory Files

## Description

Files within the same local directory or immediate subdirectories should use relative paths (e.g. `./core` or `./utils/errors`) rather than absolute path aliases (e.g. `@/core` or `@/utils/errors`). This clarifies local module boundaries, keeps modules cohesive, and prevents circular imports or resolution ambiguity during compilation and bundling.

## Anti-pattern

```typescript
// inside packages/arkenv/src/guards.ts
import { ArkEnvError } from "@/core";
import { parseStandard } from "@/parse-standard";
```

## Best Practice

```typescript
// inside packages/arkenv/src/guards.ts
import { ArkEnvError } from "./core";
import { parseStandard } from "./parse-standard";
```

## Benefits

- **Cohesion**: Groups adjacent files logically under local relative paths.
- **Robustness**: Prevents accidental circular dependencies through absolute path alias resolutions.
- **Portability**: Makes it easier to refactor, move, or isolate sub-folders as self-contained modules.
