# ADR 0008: Default Export and Function Naming

## Status

Accepted

## Context

Currently, the primary entry point for environment validation is a function named `createEnv`. However, the documentation recommends importing it as a default export and renaming it to `arkenv`:

```typescript
import arkenv from "arkenv";
```

The primary motivation for the `arkenv` naming convention is to trigger syntax highlighting in IDEs (via the ArkType VSCode extension, which looks for the `ark` prefix). Relying on the user to manually rename a default import to achieve proper DX is an unnecessary "half-measure."

## Decision

We will rename the underlying core function from `createEnv` to `arkenv`, and we will expose it as the default export of the core runtime package (`@arkenv/core`).

```typescript
// Internal implementation
export default function arkenv(...) { ... }

// Consumer usage
import arkenv from "@arkenv/core";
```

### Rationale

1. **The "One True Import":** For single-purpose libraries, a default export provides the cleanest DX (similar to `stripe` or `@clerk/clerk-js`). It signifies that this function is the primary and essential interface for the package.
2. **Native Syntax Highlighting:** By intrinsically naming the function `arkenv`, any auto-import or IDE autocomplete will natively use the `arkenv` identifier. This guarantees that users get ArkType's syntax highlighting out-of-the-box without having to learn or remember a renaming convention.
3. **Ecosystem Consistency:** The function name now perfectly matches the package namespace, reducing cognitive load.

## Consequences

- **Positive:** Zero-configuration syntax highlighting for users.
- **Positive:** Simpler, more intuitive import statements.
- **Negative:** Existing users migrating from `createEnv` will need to update their internal function references if they were using named imports or specifically typing `createEnv` in their code.
