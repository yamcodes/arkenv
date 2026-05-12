## ADDED Requirements

### Requirement: Non-Interactive Mode
The CLI SHALL support a `--yes` (or `-y`) flag to skip all interactive prompts and use recommended defaults.

#### Scenario: Running init with --yes
- **WHEN** the user runs `arkenv init --yes`
- **THEN** the system SHALL NOT display any prompts
- **AND** it SHALL proceed with default configuration (e.g., ArkType, TypeScript, default path)

### Requirement: Quiet Output Mode
The CLI SHALL support a `--quiet` flag to suppress spinners, ANSI colors, and verbose logging, providing a plain-text output suitable for AI agents.

#### Scenario: Running init with --quiet
- **WHEN** the user runs `arkenv init --quiet`
- **THEN** the system SHALL NOT display spinners
- **AND** output SHALL NOT contain ANSI escape codes
- **AND** only high-level status messages SHALL be printed

### Requirement: JSON Output Mode
The CLI SHALL support a `--json` flag that outputs a structured JSON summary of the operation results.

#### Scenario: Running init with --json
- **WHEN** the user runs `arkenv init --json`
- **THEN** the system SHALL suppress all standard console output (or redirect to stderr)
- **AND** it SHALL print a single valid JSON object to stdout upon completion
- **AND** the JSON SHALL contain details of files created and dependencies installed

### Requirement: Agent Mode Alias
The CLI SHALL support an `--agent` flag as a shorthand for `--yes` and `--quiet`.

#### Scenario: Running init with --agent
- **WHEN** the user runs `arkenv init --agent`
- **THEN** the system SHALL behave as if both `--yes` and `--quiet` were passed
- **AND** it SHALL NOT display prompts or spinners
- **AND** output SHALL be plain-text

### Requirement: AI Skill Installation Prompt
In interactive mode, the CLI SHALL ask the user if they want to install the ArkEnv AI skill for their local coding agent.

#### Scenario: Accepting AI skill installation
- **WHEN** the user is prompted "Would you like to install the ArkEnv AI skill?"
- **AND** they select "Yes"
- **THEN** the system SHALL attempt to run the command to install the skill (e.g., `pnx skills add yamcodes/arkenv`)

## MODIFIED Requirements

### Requirement: Help flag behavior
The CLI entrypoint SHALL be process-tested for stable command behavior.

#### Scenario: Help flag behavior
- **WHEN** the CLI is run with `--help` or `-h`
- **THEN** usage text SHALL be printed
- **AND** the usage text SHALL include descriptions for `--yes`, `--quiet`, and `--json`
- **AND** the process SHALL exit with code `0`
