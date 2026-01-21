# Proposal: Support Validator Mode in Vite Plugin

## Problem
Currently, the `@arkenv/vite-plugin` does not allow users to specify a validator engine. It defaults to ArkType, which causes a crash if the user removes `arktype` from their project and tries to use Standard Schema (e.g., Zod). This prevents the "validator" mode from being truly usable in Vite projects.

## Solution
1. Update the `@arkenv/vite-plugin` factory function to accept an optional `ArkEnvConfig` object as a second argument.
2. In the plugin's `config` hook, pass this configuration to the `createEnv` call.
3. Improve internal inference types to properly detect Standard Schema validators, ensuring `import.meta.env` typing works without ArkType.

## Scope
- `packages/vite-plugin`: Update `arkenv()` plugin factory signature and implementation.
- `packages/internal/types`: Update `InferType` to support Standard Schema inference (required for Vite's augmented types).
- `@repo/types`: Update `EnvSchema` to be more permissive when Standard Schema is used.

## Alternatives Considered
- **Refactoring the Entire Plugin**: Not necessary; a surgical addition of the second argument is sufficient.
- **Requiring ArkType always**: This contradicts the goal of supporting Standard Schema as an alternative.
