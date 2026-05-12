## MODIFIED Requirements

### Requirement: Scaffolding Behavior Coverage
The scaffold workflow SHALL be covered for file generation, overwrite handling, tsconfig strict-mode updates, dependency installation behavior, and configuration bootstrapping.

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

#### Scenario: Framework plugin is bootstrapped
- **WHEN** scaffolding framework-specific dependencies succeeds
- **THEN** the configuration file SHALL be updated to use the installed plugin
- **AND** a success or manual-fallback message SHALL be presented

#### Scenario: Install failure is actionable
- **WHEN** dependency installation fails
- **THEN** the error SHALL include the attempted install command
- **AND** the scaffold operation SHALL fail with non-success status
