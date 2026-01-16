---
"@repo/scope": patch
"arkenv": patch
---

#### Remove internal `@repo/keywords` package

The internal `@repo/keywords` package, which was compiled into the `arkenv` package, has been removed. The keywords are now either defined directly in the `arkenv` package or changed to pure functions.

This change was made to simplify the package structure for the validator mode.
