## Context

The CLI executes external skill processes. When the CLI needs to be quiet, the underlying skill must also be quiet to avoid noisy terminal output. However, completely swallowing the output means that if the skill process fails, developers have no way to diagnose the failure since the error output is lost. The Vercel CLI, for example, has a `--yes` flag but no `--quiet` flag, making it necessary to capture its output.

## Goals / Non-Goals

**Goals:**
- Allow quiet execution of skill processes when triggered by the `--quiet` or `-q` flag.
- Prevent interactive prompts in skill processes by confirming them ONLY when the `--yes` or `-y` flag is provided.
- Preserve and expose error logs when a skill process fails during quiet execution.

**Non-Goals:**
- Changing the standard output behavior when quiet mode is disabled.
- Modifying the underlying skill process implementations directly.

## Decisions

- **Pass `--yes` to skill processes:** This prevents interactive prompts from blocking the execution, which is especially important for tools like the Vercel CLI.
- **Use `stdio: 'pipe'` during quiet mode:** Instead of streaming output directly to the terminal, the CLI will pipe the stdout and stderr. This allows the CLI to capture the logs in memory.
- **Attach logs on failure:** If the child process exits with a non-zero code, the CLI will attach the captured error logs to its final output or JSON payload. If successful, the captured logs are discarded, maintaining the quiet contract.

## Risks / Trade-offs

- **Memory consumption:** Piping output instead of streaming or ignoring it means the output is buffered in memory. If a skill process generates a massive amount of output, it could cause memory issues. Mitigation: Typical skill processes do not produce gigabytes of output, so this risk is acceptable for now.
