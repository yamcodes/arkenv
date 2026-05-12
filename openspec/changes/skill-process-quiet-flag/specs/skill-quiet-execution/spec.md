## ADDED Requirements

### Requirement: Quiet Execution with Error Capture
The CLI SHALL execute skill processes quietly when the quiet mode is active, capturing stdout and stderr in memory instead of piping them to the terminal.

#### Scenario: Successful quiet execution
- **WHEN** quiet mode is active and the skill process succeeds (exit code 0)
- **THEN** the CLI produces no terminal output from the skill process.

#### Scenario: Failed quiet execution
- **WHEN** quiet mode is active and the skill process fails (non-zero exit code)
- **THEN** the CLI attaches the captured error logs to its final output or JSON payload.

### Requirement: Auto-confirmation for skill processes
The CLI SHALL automatically pass the `--yes` flag to skill processes to prevent interactive prompts.

#### Scenario: Preventing interactive prompts
- **WHEN** invoking a skill process
- **THEN** the CLI includes the `--yes` flag in the command execution.
