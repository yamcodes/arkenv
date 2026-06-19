# Avoid Referencing Index Files in Import Paths

## Description

Importing explicitly from an `index` file (e.g., `import { type } from "@/index"` or `import { applyCoercion } from "@/coercion/index"`) is redundant in module resolution systems and clutters import statements. Both TypeScript and Node.js automatically resolve directory index files by default.

## Anti-pattern

```typescript
import { type } from "@/index";
import { applyCoercion } from "@/coercion/index";
import { arkenv } from "./standard/index";
```

## Best Practice

```typescript
import { type } from "@";
import { applyCoercion } from "@/coercion";
import { arkenv } from "./standard";
```

## Benefits

- **Readability**: Keeps import declarations concise and clean.
- **Maintenance**: Facilitates refactoring and renaming of internal structures.
- **Consistency**: Standardizes import style across the codebase.
