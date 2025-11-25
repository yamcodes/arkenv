# Change: Add Vite Logger Support for Pretty Printing

## Why

Currently, the Vite plugin uses ArkEnv's error formatting which relies on ANSI color codes via the `styleText` utility. Issue #206 requests using Vite's built-in logger (which uses picocolors internally) for better integration with Vite's build output and to follow Vite's best practices.

The implementation should be minimal on the Vite plugin side and adhere to Vite's best practices. We should strive to make the plugin work with a standard API logger, and "bring that logger" from the Vite plugin to the core arkenv library, rather than doing a lot of custom code on the Vite plugin side. In essence, our current `styleText` util should be grown to support Vite's logger (based on picocolors internally) and others in the future.

## What Changes

- **ADDED**: Logger abstraction interface to support pluggable loggers (Vite's logger, and others in the future)
- **MODIFIED**: `styleText` utility to accept an optional logger function for styling text
- **MODIFIED**: `formatErrors` function to accept an optional logger for error formatting
- **MODIFIED**: `ArkEnvError` class to accept an optional logger for error message formatting
- **MODIFIED**: `createEnv` function to accept an optional logger parameter
- **MODIFIED**: Vite plugin to use Vite's logger for error formatting when validation fails
- **ADDED**: Logger adapter utilities to convert Vite's logger API to the standard logger interface

## Impact

- **Affected specs**: 
  - `error-formatting` (new capability)
  - `vite-plugin` (modified to use logger)
- **Affected code**: 
  - `packages/arkenv/src/utils/style-text.ts` - Extended to support logger
  - `packages/arkenv/src/errors.ts` - Modified to accept logger
  - `packages/arkenv/src/create-env.ts` - Modified to accept and pass logger
  - `packages/vite-plugin/src/index.ts` - Modified to use Vite's logger
- **Breaking changes**: None (logger parameter is optional, defaults to current behavior)
- **Dependencies**: No new external dependencies (uses Vite's logger when available)

