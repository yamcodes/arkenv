# Proposal: Support Validator Mode in Bun Plugin

## Why
Support the "standard" validator mode in `@arkenv/bun-plugin` to allow users to validate environment variables using libraries like Zod or Valibot without requiring `arktype` as a dependency. This enables a zero-ArkType runtime for Bun projects.

## What Changes
- **MODIFIED**: Update the `arkenv()` plugin factory in `packages/bun-plugin/src/plugin.ts` to accept an optional `ArkEnvConfig` object as a second argument.
- **MODIFIED**: Update the `processEnvSchema` utility in `packages/bun-plugin/src/utils.ts` to accept and pass through the `ArkEnvConfig` to the `createEnv` call.
- **FILES AFFECTED**:
  - `packages/bun-plugin/src/plugin.ts`
  - `packages/bun-plugin/src/utils.ts`

## Impact
- **Users**: Enables users who have removed `arktype` to still use ArkEnv's Bun plugin with Standard Schema validators.
- **Type System**: Leverages downstream type inference improvements via `InferType` (from `vite-plugin-validator-mode`).
- **Dependencies**: Introduces a dependency on the logic/types developed in the `vite-plugin-validator-mode` change.
