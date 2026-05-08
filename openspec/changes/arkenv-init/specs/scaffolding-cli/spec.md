## ADDED Requirements

### Requirement: Interactive Wizard
The CLI SHALL provide an interactive experience to guide the user through setting up ArkEnv.

#### Scenario: Running the CLI
- **WHEN** the user runs `pnpm dlx arkenv@latest init`
- **THEN** the `arkenv` proxy script SHALL detect the `init` command and delegate to `@arkenv/cli@<same-version>`
- **AND** the system SHALL display a welcome message and start the prompt sequence

### Requirement: Zero-Dependency Proxy
The `arkenv` package SHALL NOT have any runtime dependencies for CLI functionality.

#### Scenario: Inspecting arkenv dependencies
- **WHEN** a user installs `arkenv` as a library dependency
- **THEN** `arkenv`'s `dependencies` field SHALL be empty (`{}`)
- **AND** no CLI-related packages (`@clack/prompts`, `picocolors`) SHALL be installed

### Requirement: Version-Locked Spawning
The proxy script SHALL spawn `@arkenv/cli` at the same version as the invoking `arkenv` package.

#### Scenario: Spawning the CLI
- **WHEN** `arkenv@0.12.0` receives the `init` command
- **THEN** the proxy SHALL invoke `@arkenv/cli@0.12.0` (not `@latest`)

### Requirement: Package-Runner-Aware Delegation
The proxy SHALL detect the user's package runner and use the same tool for the sub-call.

#### Scenario: Running via pnpm
- **WHEN** the user runs `pnpm dlx arkenv@latest init`
- **THEN** the proxy SHALL use `pnpm dlx @arkenv/cli@<version> init` for the sub-call

#### Scenario: Running via npx
- **WHEN** the user runs `npx arkenv@latest init`
- **THEN** the proxy SHALL use `npx --yes @arkenv/cli@<version> init` for the sub-call

### Requirement: Signal Propagation
The proxy SHALL properly forward process signals to the child CLI process.

#### Scenario: User cancels with Ctrl+C
- **WHEN** the user presses Ctrl+C during the interactive wizard
- **THEN** the proxy SHALL forward `SIGINT` to the `@arkenv/cli` child process
- **AND** the child process SHALL terminate gracefully (restoring terminal state)
- **AND** the proxy SHALL exit with the child's exit code

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
The system SHALL detect the local package manager and install the required dependencies (Arkenv + selected validator).

#### Scenario: Detecting via npm_config_user_agent
- **WHEN** `npm_config_user_agent` contains "pnpm"
- **THEN** the system SHALL use `pnpm add` to install dependencies

#### Scenario: Detecting via packageManager field
- **WHEN** the `packageManager` field in `package.json` is set to "pnpm@9.0.0"
- **THEN** the system SHALL use `pnpm add` to install dependencies

#### Scenario: Detecting via lockfile
- **WHEN** a `pnpm-lock.yaml` is present
- **THEN** the system SHALL use `pnpm add` to install dependencies
