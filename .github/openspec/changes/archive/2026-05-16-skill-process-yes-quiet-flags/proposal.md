## Why

The underlying skill process needs to be executed silently to satisfy a quiet execution contract. However, if the process fails, the error output is lost if it's completely suppressed. We need a way to keep the terminal quiet during successful runs while capturing and exposing the error log if the child process exits with a non-zero code.

## What Changes

- Pass `--yes` to the underlying skill process ONLY when `--yes` (or `-y`) is provided in the input (to prevent interactive prompts, e.g., in Vercel CLI).
- Execute the skill process with `stdio: 'pipe'` instead of streaming directly to the terminal when quiet mode is active (triggered by passing `--quiet` or `-q`).
- Capture the output and error logs in the background.
- If the child process exits with a non-zero code, attach the captured error log to the final CLI output or JSON payload.

## Capabilities

### New Capabilities
- `skill-quiet-execution`: Execution of skill processes with quiet output but captured error logging on failure.

### Modified Capabilities

## Impact

- CLI process execution logic (likely the area handling skill invocation).
- Error handling and output formatting for failed skill executions.
