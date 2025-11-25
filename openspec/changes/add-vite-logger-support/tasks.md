## 1. Core Library Changes

- [ ] 1.1 Extend `styleText` utility to accept optional logger parameter
  - Add `LoggerStyle` type definition
  - Make logger parameter optional
  - Use logger if provided, otherwise use current ANSI behavior
  - Update tests to cover logger parameter

- [ ] 1.2 Extend `formatErrors` function to accept optional logger
  - Add optional logger parameter
  - Pass logger to `styleText` calls
  - Update tests to verify logger usage

- [ ] 1.3 Extend `ArkEnvError` class to accept optional logger
  - Add optional logger parameter to constructor
  - Pass logger to `formatErrors` and `styleText` calls
  - Update tests to verify logger usage

- [ ] 1.4 Extend `createEnv` function to accept optional logger
  - Add optional logger parameter
  - Pass logger to `ArkEnvError` when validation fails
  - Update tests to verify logger propagation

## 2. Vite Plugin Changes

- [ ] 2.1 Create Vite logger adapter utility
  - Create adapter function that converts Vite's logger to `LoggerStyle` interface
  - Extract picocolors functionality from Vite's logger
  - Add tests for adapter function

- [ ] 2.2 Update Vite plugin to use logger
  - Access Vite's logger from resolved config in `configResolved` hook
  - Create logger adapter from Vite's logger
  - Pass logger adapter to `createEnv` call
  - Handle validation errors and use Vite's logger for formatting
  - Display errors using Vite's logger methods
  - Fail build with `this.error()` after displaying formatted errors

- [ ] 2.3 Add integration tests for Vite plugin with logger
  - Test error formatting with Vite's logger
  - Verify error output format
  - Test build failure behavior

## 3. Validation

- [ ] 3.1 Verify backward compatibility
  - Run existing tests to ensure no regressions
  - Verify default behavior when no logger is provided

- [ ] 3.2 Test Vite plugin error output
  - Create test fixture with invalid environment variables
  - Verify error messages are formatted using Vite's logger
  - Verify error output matches Vite's build output style

- [ ] 3.3 Validate OpenSpec proposal
  - Run `openspec validate add-vite-logger-support --strict`
  - Fix any validation issues

