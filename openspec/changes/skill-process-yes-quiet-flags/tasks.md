## 1. Skill Execution Arguments Update

- [ ] 1.1 Locate the skill invocation execution logic (e.g., child process spawn/exec functions in the CLI package).
- [ ] 1.2 Modify the invocation logic to append the `--yes` flag to skill process arguments ONLY if the user provided `--yes` (or `-y`) to the CLI.

## 2. Quiet Mode Implementation with Error Capture

- [ ] 2.1 Update the spawn/exec options to conditionally use `stdio: 'pipe'` instead of streaming to the terminal when quiet mode is enabled (via `--quiet` or `-q` flags).
- [ ] 2.2 Implement stream listeners to capture and buffer `stdout` and `stderr` from the child process.
- [ ] 2.3 Add logic in the process exit handler to evaluate the exit code.
- [ ] 2.4 On a non-zero exit code during quiet execution, attach the buffered logs to the final CLI output (or JSON payload) so the error is exposed.
- [ ] 2.5 Ensure that on a successful execution (exit code 0), the buffered logs are cleanly discarded without printing to the terminal.

## 3. Testing and Validation

- [ ] 3.1 Write tests to verify that `--yes` is passed to skill processes ONLY when the CLI receives `--yes` or `-y`.
- [ ] 3.2 Add a test case for successful quiet execution, ensuring no output is produced.
- [ ] 3.3 Add a test case for failed quiet execution, ensuring the captured error log is included in the output.
