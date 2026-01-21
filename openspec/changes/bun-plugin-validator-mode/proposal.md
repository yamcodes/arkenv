# Proposal: Support Validator Mode in Bun Plugin

## Problem
Currently, the `@arkenv/bun-plugin` does not allow users to specify a validator engine. It defaults to ArkType, which causes a crash if the user removes `arktype` from their project and tries to use Standard Schema validators (e.g., Zod, Valibot). This prevents the "validator" mode from being truly usable in Bun projects.

## Solution
1. Update the `@arkenv/bun-plugin` factory function to accept an optional `ArkEnvConfig` object as a second argument.
2. In the plugin's `processEnvSchema` utility, pass this configuration to the `createEnv` call.
3. Leverage the existing `InferType` improvements (from `vite-plugin-validator-mode`) to ensure proper type inference for Standard Schema validators.

## Scope
- `packages/bun-plugin`: Update `arkenv()` plugin factory signature and implementation.
- `packages/bun-plugin/src/utils.ts`: Update `processEnvSchema` to accept and pass through config.

## Alternatives Considered
- **Refactoring the Entire Plugin**: Not necessary; a surgical addition of the second argument is sufficient, mirroring the Vite plugin approach.
- **Requiring ArkType always**: This contradicts the goal of supporting Standard Schema as an alternative.

## Dependencies
- Requires `vite-plugin-validator-mode` to be complete (for `InferType` and `ArkEnvConfig` export).
