# Change: Fix Standard Mode Type Inference

## Context
In `arkenv` v0.9.0, we introduced a `validator` mode to allow using ArkEnv without ArkType by leveraging the Standard Schema 1.0 specification. While this works at runtime, it is currently broken at compile-time: `createEnv` always returns an object inferred using ArkType's type system, even when `validator: "standard"` is specified.

This leads to two problems:
1. If ArkType is not installed, the type-level imports and utility types (like `distill.Out` and `at.infer`) might fail or behave unpredictably.
2. The inferred type is not correct because it relies on ArkType's understanding of the schema, which might differ from a Standard Schema validator's understanding (e.g., Zod, Valibot).

## Why
Standard Schema is a universal standard for validation libraries. Many users want to use ArkEnv's simple API with their existing Zod or Valibot schemas without being forced to install or use ArkType for type inference.

## High-Level Idea
Refactor `createEnv` overloads to use conditional types or separate overloads that switch the return type based on the `validator` configuration.

- If `validator: "standard"`, use `StandardSchemaV1.InferOutput` for each key in the schema.
- If `validator: "arktype"` (or default), continue using ArkType-based inference.

## What Changes

### 1. `createEnv` Overloads
We will update `createEnv` to correctly dispatch to the appropriate inference engine at the type level.

### 2. Centralized Standard Schema Types
We already have `packages/internal/types/src/standard-schema.ts`. We will use the `InferOutput` utility from this file.

### 3. Purpose Update
We will also address the "TBD" in `openspec/specs/validator-mode/spec.md` by providing a proper purpose statement.

## Explicit Non-Goals
- Changing the runtime validation logic (already implemented).
- Introducing complex auto-detection of schemas (we stick to the explicit `validator` flag).

## Design Principle
**Type Safety without Vendor Lock-in.** ArkEnv should provide first-class type safety for both ArkType and Standard Schema users, respecting the inference rules of each.
