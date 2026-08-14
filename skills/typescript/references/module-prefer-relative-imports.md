# Prefer Relative Imports for Local Directory Files

## Description

Files within the same local directory or immediate subdirectories should use relative paths (e.g. `./core` or `./utils/errors`) rather than absolute path aliases (e.g. `@/core` or `@/utils/errors`). This clarifies local module boundaries, keeps modules cohesive, and prevents circular imports or resolution ambiguity during compilation and bundling.

**Parent-directory imports (`../`) must always use path aliases** (e.g. `@/core` or `~/lib/cn`). Traversing up the directory tree with `../` creates fragile coupling, breaks when files are moved, and makes refactoring error-prone.

## Anti-pattern

```typescript
// inside packages/arkenv/src/guards.ts
import { ArkEnvError } from "@/core";
import { parseStandard } from "@/parse-standard";

// inside packages/arkenv/src/utils/errors.ts
import { ArkEnvError } from "../core";

// inside apps/www/components/ui/popover.tsx
import { cn } from "../../lib/cn";
```

## Best Practice

```typescript
// inside packages/arkenv/src/guards.ts
import { ArkEnvError } from "./core";
import { parseStandard } from "./parse-standard";

// inside packages/arkenv/src/utils/errors.ts
import { ArkEnvError } from "@/core";

// inside apps/www/components/ui/popover.tsx
import { cn } from "~/lib/cn";
```

## Benefits

- **Cohesion**: Groups adjacent files logically under local relative paths.
- **Robustness**: Prevents accidental circular dependencies through absolute path alias resolutions.
- **Portability**: Makes it easier to refactor, move, or isolate sub-folders as self-contained modules.
- **Stability**: Eliminates `../` chains that break when files are relocated within the package.
