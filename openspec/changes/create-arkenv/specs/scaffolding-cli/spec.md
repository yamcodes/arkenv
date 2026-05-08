## ADDED Requirements

### Requirement: Interactive Wizard
The CLI SHALL provide an interactive experience to guide the user through setting up ArkEnv.

#### Scenario: Running the CLI
- **WHEN** the user runs `pnpm create arkenv@latest`
- **THEN** the system SHALL display a welcome message and start the prompt sequence

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

#### Scenario: Detecting via packageManager field
- **WHEN** the `packageManager` field in `package.json` is set to "pnpm@9.0.0"
- **THEN** the system SHALL use `pnpm add` to install dependencies

#### Scenario: Detecting via lockfile
- **WHEN** a `pnpm-lock.yaml` is present or the user is running via `pnpm create arkenv@latest`
- **THEN** the system SHALL use `pnpm add` to install dependencies
