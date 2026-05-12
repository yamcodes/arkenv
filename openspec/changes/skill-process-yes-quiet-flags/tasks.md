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

- [ ] 3.1 Write unit tests to verify that `--yes` is passed to skill processes ONLY when the CLI receives `--yes` or `-y`.
- [ ] 3.2 Add integration tests for successful quiet execution, ensuring no output is produced when `--quiet` or `-q` is provided.
- [ ] 3.3 Add integration tests for failed quiet execution, ensuring the captured error log is included in the output.

## 4. Documentation

- [ ] 4.1 Update the CLI usage documentation (e.g., in README, docs site, or CLI help output) to describe the behavior of the `--yes` (`-y`) and `--quiet` (`-q`) flags.
- [ ] 4.2 Document the error handling behavior (capturing and displaying logs on failure) when running skill processes in quiet mode.
