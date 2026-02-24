# ArkType Land

This module **assumes that the user has `arktype` installed** in their project. It is intentionally isolated from the core of `arkenv` to allow for optional and lazy loading of the ArkType library.

The logic here is specific to ArkType and will not work without it.

## Content

This directory contains the ArkType-specific validator logic for `arkenv`.

- `index.ts`: The main entry point for the ArkType validator, which integrates with `@repo/scope`.
- `coercion/`: Logic for introspecting ArkType schemas and applying automatic type coercion (e.g., parsing "3000" as a number).

## How it works

When `createEnv` is called via `arkenv` (the main entry), this module is statically imported. The main entry has an explicit, static dependency on ArkType. Users who want an ArkType-free path use `arkenv/standard` instead.
