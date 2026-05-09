# scaffolding-cli Specification

## Purpose
TBD - created by archiving change arkenv-cli-adequate-testing. Update Purpose after archive.
## Requirements
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

### Requirement: Interactive Wizard
The CLI SHALL provide an interactive experience to guide the user through setting up ArkEnv.

#### Scenario: Running the CLI
- **WHEN** the user runs `pnpm dlx @arkenv/cli@latest init`
- **THEN** the system SHALL display a welcome message and start the prompt sequence

### Requirement: Zero-Dependency Core Library
The `arkenv` package SHALL NOT have any runtime dependencies or CLI scripts.

#### Scenario: Inspecting arkenv dependencies
- **WHEN** a user installs `arkenv` as a library dependency
- **THEN** `arkenv`'s `dependencies` field SHALL be empty (`{}`)
- **AND** no CLI-related packages (`@clack/prompts`, `picocolors`) SHALL be installed
- **AND** the package SHALL NOT export a `bin` executable

### Requirement: Validator Selection
The system SHALL allow the user to select their preferred validation library.

#### Scenario: Selecting ArkType
- **WHEN** the user selects "ArkType" from the validator prompt
- **THEN** the generated `env.ts` SHALL use ArkType syntax for schema definition

### Requirement: Framework Selection
The system SHALL allow the user to select their target runtime or framework.

#### Scenario: Selecting Vite
- **WHEN** the user selects "Vite" from the framework prompt
- **THEN** the system SHALL include Vite-specific configuration hints in the final output

### Requirement: Language Selection
The system SHALL allow the user to choose between TypeScript and JavaScript.

#### Scenario: Selecting TypeScript
- **WHEN** the user selects "TypeScript"
- **THEN** the system SHALL generate files with `.ts` extensions and include type definitions

### Requirement: File Generation
The system SHALL generate the necessary configuration files for ArkEnv based on the user's selections.

#### Scenario: Generating env.ts
- **WHEN** the wizard completes
- **THEN** the system SHALL write a valid `env.ts` file to the target directory

### Requirement: Dependency Installation
The system SHALL detect the local package manager and install the required dependencies (ArkEnv + selected validator).

#### Scenario: Detecting via npm_config_user_agent
- **WHEN** `npm_config_user_agent` contains "pnpm"
- **THEN** the system SHALL use `pnpm add` to install dependencies

#### Scenario: Detecting via packageManager field
- **WHEN** the `packageManager` field in `package.json` is set to "pnpm@9.0.0"
- **THEN** the system SHALL use `pnpm add` to install dependencies

#### Scenario: Detecting via lockfile
- **WHEN** a `pnpm-lock.yaml` is present
- **THEN** the system SHALL use `pnpm add` to install dependencies

