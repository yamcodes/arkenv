## ADDED Requirements

### Requirement: CLI Testing Baseline

The `@arkenv/cli` package SHALL maintain an automated test suite that covers critical scaffolding behavior and command-level contracts.

#### Scenario: Baseline suite is present
- **WHEN** the CLI package is validated in CI
- **THEN** automated tests SHALL execute for `@arkenv/cli`
- **AND** tests SHALL include both logic-level and process-level coverage

### Requirement: Scaffolding Behavior Coverage

The scaffold workflow SHALL be covered for file generation, overwrite handling, tsconfig strict-mode updates, and dependency installation behavior.

#### Scenario: Creating a new env config file
- **WHEN** `scaffold()` runs with a target path that does not exist
- **THEN** it SHALL write the generated env config file
- **AND** the file content SHALL match the selected validator template

#### Scenario: Existing file overwrite is declined
- **WHEN** `scaffold()` runs and the target file already exists
- **AND** overwrite confirmation is declined
- **THEN** the existing file SHALL remain unchanged

#### Scenario: Existing file overwrite is accepted
- **WHEN** `scaffold()` runs and the target file already exists
- **AND** overwrite confirmation is accepted
- **THEN** the target file SHALL be replaced with generated content

#### Scenario: Strict mode update is requested
- **WHEN** `scaffold()` runs with `shouldUpdateTsConfig: true`
- **THEN** tsconfig strict mode SHALL be updated when possible
- **AND** status SHALL report `updated`, `already_strict`, `not_found`, or `error`

#### Scenario: Framework-specific dependencies are installed
- **WHEN** scaffolding runs for `vite`, `bun`, or `node`
- **THEN** dependency install command SHALL include `arkenv` and selected validator
- **AND** it SHALL include `@arkenv/vite-plugin` only for `vite`
- **AND** it SHALL include `@arkenv/bun-plugin` only for `bun`

#### Scenario: Install failure is actionable
- **WHEN** dependency installation fails
- **THEN** the error SHALL include the attempted install command
- **AND** the scaffold operation SHALL fail with non-success status

### Requirement: Detection Heuristics Coverage

Package-manager and framework detection heuristics SHALL be covered by automated tests using deterministic fixtures.

#### Scenario: Framework detection from project files
- **WHEN** project dependencies or config files imply `vite` or `bun`
- **THEN** detection SHALL return the matching framework
- **AND** it SHALL default to `node` when no framework signal exists

#### Scenario: Package manager detection from workspace signals
- **WHEN** lockfiles or package metadata indicate a package manager
- **THEN** the corresponding install command SHALL be selected
- **AND** detection SHALL default to `npm` when no signal exists

### Requirement: CLI Command Contract Coverage

The CLI entrypoint SHALL be process-tested for stable command behavior.

#### Scenario: Help flag behavior
- **WHEN** the CLI is run with `--help` or `-h`
- **THEN** usage text SHALL be printed
- **AND** the process SHALL exit with code `0`

#### Scenario: Unsupported command behavior
- **WHEN** the CLI is run with an unsupported command
- **THEN** usage text SHALL be printed
- **AND** the process SHALL exit with code `0`
