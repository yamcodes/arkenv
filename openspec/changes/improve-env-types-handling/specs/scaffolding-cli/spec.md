## MODIFIED Requirements

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

#### Scenario: Existing file append is selected
- **WHEN** `scaffold()` runs and the target file (e.g., `vite-env.d.ts`) already exists
- **AND** the append option is selected
- **THEN** the system SHALL append the required types to the existing file
- **AND** existing content SHALL be preserved

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

### Requirement: Interactive Wizard
The CLI SHALL provide an interactive experience to guide the user through setting up ArkEnv, with smart detection of existing files to provide context-aware prompts.

#### Scenario: Running the CLI
- **WHEN** the user runs `pnx @arkenv/cli@latest init`
- **THEN** the system SHALL display a welcome message and start the prompt sequence

#### Scenario: Prompting for vite-env.d.ts when file is missing
- **WHEN** the wizard reaches the `vite-env.d.ts` step
- **AND** `vite-env.d.ts` does NOT exist in the filesystem
- **THEN** it SHALL ask "Establish vite-env.d.ts for typesafe environment variables?"
- **AND** it SHALL set `envDtsHandling = "overwrite"` when the user answers "Yes" to indicate creating the new file.

#### Scenario: Prompting for vite-env.d.ts when file exists
- **WHEN** the wizard reaches the `vite-env.d.ts` step
- **AND** `vite-env.d.ts` ALREADY exists in the filesystem
- **THEN** it SHALL ask "Found existing vite-env.d.ts. How should we handle ArkEnv types?"
- **AND** it SHALL provide "Append types safely", "Overwrite entirely", and "Skip" options

#### Scenario: Prompting for bun-env.d.ts when file is missing
- **WHEN** the wizard reaches the `bun-env.d.ts` step
- **AND** `bun-env.d.ts` does NOT exist in the filesystem
- **THEN** it SHALL ask "Establish bun-env.d.ts for typesafe environment variables?"
- **AND** it SHALL set `envDtsHandling = "overwrite"` when the user answers "Yes" to indicate creating the new file (mirroring the vite-env.d.ts behavior).

#### Scenario: Prompting for bun-env.d.ts when file exists
- **WHEN** the wizard reaches the `bun-env.d.ts` step
- **AND** `bun-env.d.ts` ALREADY exists in the filesystem
- **THEN** it SHALL ask "Found existing bun-env.d.ts. How should we handle ArkEnv types?"
- **AND** it SHALL provide "Append types safely", "Overwrite entirely", and "Skip" options
