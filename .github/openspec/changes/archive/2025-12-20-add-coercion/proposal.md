# Coercion

## Why
Environment variables are always strings at runtime, but users want to treat them as typed primitives (like `number` or `boolean`) without manual conversion.

While ArkType supports "morphs" for transformation, applying them directly to base keywords like `number` prevents the use of refinements (e.g., `number >= 18` or `number % 2`) because ArkType's parser cannot apply numeric constraints to non-numeric nodes (morphs).

## What Changes
We keep the core primitives clean and apply a **Global Schema Transformer** during environment parsing in `arkenv`.

1.  **Keywords**: Define `parsedNumber` and `parsedBoolean` in `@repo/keywords` as reusable building blocks that handle string-to-primitive conversion.
2.  **Scope**: Keep `number` and `boolean` as standard ArkType types in `@repo/scope` so they remain "constrainable" (supporting ranges, divisors, etc.).
3.  **Transformation**: In `createEnv`, use ArkType's `schema.transform()` to walk the fully parsed schema. The transformer identifies numeric and boolean leaf nodes and automatically wraps them in the appropriate coercion morph.

This approach provides full coercion support for environment variables while preserving ArkType's ability to validate ranges, divisors, and other numeric constraints.
