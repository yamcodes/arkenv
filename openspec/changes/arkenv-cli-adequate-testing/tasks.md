## 1. Test Harness Setup

- [x] 1.1 Add test configuration for `packages/arkenv-cli` (Vitest project or package-local config)
- [x] 1.2 Add package scripts for test execution (`test`, `test:run`)
- [x] 1.3 Ensure monorepo test command includes `@arkenv/cli` in CI execution

## 2. Unit Coverage

- [x] 2.1 Add tests for env template selection by validator (`arktype`, `zod`, `valibot`)
- [x] 2.2 Add tests for framework note/content behavior (`vite`, `bun`, `node`)
- [x] 2.3 Add tests for tsconfig status detection (`strict`, `not_strict`, `not_found`)

## 3. Integration Coverage for Scaffolding

- [x] 3.1 Test file creation in empty target path
- [x] 3.2 Test existing-file flow when overwrite is declined
- [x] 3.3 Test existing-file flow when overwrite is accepted
- [x] 3.4 Test strict-mode update flow (`shouldUpdateTsConfig: true`)
- [x] 3.5 Test dependency install command composition per framework/runtime
- [x] 3.6 Test install-failure error propagation and message context

## 4. CLI Process Smoke Tests

- [x] 4.1 Validate `--help` output and exit code
- [x] 4.2 Validate invalid command behavior (usage shown, clean exit)
- [x] 4.3 Validate non-interactive stable behavior without TTY assumptions

## 5. Documentation and Verification

- [x] 5.1 Update `TESTING.md` with `@arkenv/cli` test strategy and run commands
- [x] 5.2 Run CLI package tests locally and confirm green
- [x] 5.3 Run monorepo test command to confirm no cross-project regressions
