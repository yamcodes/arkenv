## ADDED Requirements

### Requirement: Quiet Execution with Error Capture
The CLI SHALL execute skill processes quietly when the quiet mode is active (triggered by `--quiet` or `-q`), capturing stdout and stderr in memory instead of piping them to the terminal.

#### Scenario: Successful quiet execution
- **WHEN** quiet mode is active and the skill process succeeds (exit code 0)
- **THEN** the CLI produces no terminal output from the skill process.

#### Scenario: Failed quiet execution
- **WHEN** quiet mode is active and the skill process fails (non-zero exit code)
- **THEN** the CLI attaches the captured error logs to its final output or JSON payload.

### Requirement: Explicit auto-confirmation for skill processes
The CLI SHALL pass the `--yes` flag to skill processes ONLY when `--yes` or `-y` is provided in the user input.

#### Scenario: Passing the --yes flag
- **WHEN** invoking a skill process AND the user provided the `--yes` or `-y` flag
- **THEN** the CLI includes the `--yes` flag in the command execution.
