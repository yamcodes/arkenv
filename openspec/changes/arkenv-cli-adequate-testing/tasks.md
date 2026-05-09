## 1. Test Harness Setup

- [ ] 1.1 Add test configuration for `packages/arkenv-cli` (Vitest project or package-local config)
- [ ] 1.2 Add package scripts for test execution (`test`, `test:run`)
- [ ] 1.3 Ensure monorepo test command includes `@arkenv/cli` in CI execution

## 2. Unit Coverage

- [ ] 2.1 Add tests for env template selection by validator (`arktype`, `zod`, `valibot`)
- [ ] 2.2 Add tests for framework note/content behavior (`vite`, `bun`, `node`)
- [ ] 2.3 Add tests for tsconfig status detection (`strict`, `not_strict`, `not_found`)

## 3. Integration Coverage for Scaffolding

- [ ] 3.1 Test file creation in empty target path
- [ ] 3.2 Test existing-file flow when overwrite is declined
- [ ] 3.3 Test existing-file flow when overwrite is accepted
- [ ] 3.4 Test strict-mode update flow (`shouldUpdateTsConfig: true`)
- [ ] 3.5 Test dependency install command composition per framework/runtime
- [ ] 3.6 Test install-failure error propagation and message context

## 4. CLI Process Smoke Tests

- [ ] 4.1 Validate `--help` output and exit code
- [ ] 4.2 Validate invalid command behavior (usage shown, clean exit)
- [ ] 4.3 Validate non-interactive stable behavior without TTY assumptions

## 5. Documentation and Verification

- [ ] 5.1 Update `TESTING.md` with `@arkenv/cli` test strategy and run commands
- [ ] 5.2 Run CLI package tests locally and confirm green
- [ ] 5.3 Run monorepo test command to confirm no cross-project regressions
