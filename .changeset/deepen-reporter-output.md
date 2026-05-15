---
"@arkenv/cli": patch
---

#### Fix JSON output routing and improve CLI reliability

Fixed several inconsistencies in how the CLI reports its progress and errors:
- **Correct JSON Stream Routing**: When using `--json`, interactive logs and progress updates are now correctly routed to `stderr`. This ensures that `stdout` contains only valid, pipeable JSON data.
- **Improved Silent Mode**: Fixed a bug where some ANSI escape codes could leak into the output when running in `--quiet` mode.
- **Accurate Exit Codes**: The CLI now consistently exits with a non-zero status code when a process is cancelled or fails, improving compatibility with CI/CD pipelines.
- **Safer Error Logging**: Error stacks and crash details are now routed exclusively to `stderr`, preventing them from corrupting structured output.
