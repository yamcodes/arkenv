# Use Standard Comments for Internal Developer Notes

**Priority:** HIGH
**Category:** Module Organization

## Rule

Use standard block comments (`/* ... */`) or line comments (`//`) instead of JSDoc comments (`/** ... */`) when writing internal architectural warnings, maintainer notes, or "DO NOT EDIT" directives that precede exported types, interfaces, or functions.

## Rationale

When a JSDoc block (`/** ... */`) immediately precedes an export declaration (such as `export type`, `export class`, or `export function`), the TypeScript compiler automatically attaches that comment as the official documentation for the type. 

During the build process, when emitting declaration files (`.d.ts`, `.d.mts`, `.d.cts`), bundlers and `tsc` will preserve attached JSDoc comments so they appear in editor tooltips (IntelliSense) for downstream consumers. This causes internal repository developer warnings to unexpectedly leak to end users who hover over the imported symbol.

Standard comments (`/* */` or `//`), on the other hand, are safely stripped by the compiler and bundlers from output declaration files and runtime code.

## Examples

### ❌ Incorrect: JSDoc used for internal maintainer warnings
```typescript
/**
 * ⚠️ ARCHITECTURAL WARNING: DO NOT DRY THIS FILE ⚠️
 * 
 * If you attempt to unify this logic, bundlers will trace the
 * imports and break the zero-dependency promise of this package.
 */
export type ParseConfig = {
  // ...
};
```
*Result: The warning leaks into the compiled `.d.ts` file and appears when consumers hover over `ParseConfig`.*

### ✅ Correct: Standard block comment for internal maintainer warnings
```typescript
/*
 * ⚠️ ARCHITECTURAL WARNING: DO NOT DRY THIS FILE ⚠️
 * 
 * If you attempt to unify this logic, bundlers will trace the
 * imports and break the zero-dependency promise of this package.
 */

/**
 * Configuration options for the parser.
 */
export type ParseConfig = {
  // ...
};
```
*Result: The standard block comment is entirely stripped during compilation, remaining visible only in the source repository. Only the actual JSDoc documentation makes it into the `.d.ts` file.*
