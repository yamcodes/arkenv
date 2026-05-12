## Why

AI-native developers increasingly onboard tools by instructing an agent (e.g., "set up ArkEnv for me"), but `@arkenv/cli` today outputs interactive prompts, spinners, and rich ANSI sequences that cause agents to misread terminal output, hallucinate success/failure, and burn unnecessary tokens. Adding a non-interactive, machine-readable mode makes the CLI usable as the execution engine in both Flow 1 (CLI-first) and Flow 2 (skill-first) onboarding, while also cementing the `--yes` flag as the canonical instruction in the `yamcodes/arkenv` skill so agents always delegate to the CLI rather than attempting to scaffold files manually.

## What Changes

- Add a `--yes` / `-y` flag to `@arkenv/cli init` that bypasses all interactive prompts and accepts safe defaults.
- Add an `--agent` flag as a shorthand for `--yes --quiet` (and optionally `--json`), providing a single canonical flag for machine-readable execution.
- Add a `--quiet` flag (composable with `--yes`) that suppresses spinners and ANSI formatting, emitting plain-text status lines suitable for agent stdout ingestion.
- Add a `--json` output mode that emits a structured JSON summary of every file written, package installed, and configuration change made — giving agents a definitive, parseable success signal.
- Update the `yamcodes/arkenv` skill instructions to include an explicit "Agent Setup" section instructing the LLM to run `pnpm dlx @arkenv/cli@latest init --agent` rather than writing configuration files manually.
- Optionally prompt during interactive `init` whether to install the ArkEnv AI skill for the local coding agent (`? Would you like to install the ArkEnv AI skill? (Y/n)`) — wiring `pnx skills add yamcodes/arkenv` automatically.

## Capabilities

### New Capabilities

- `cli-agent-mode`: Non-interactive `--yes` / `--quiet` / `--json` / `--agent` flags on `@arkenv/cli init` that make the CLI fully machine-readable and safe to invoke from an AI agent context.

### Modified Capabilities

- `scaffolding-cli`: The existing scaffolding flow gains flag-gated behaviour for non-interactive invocation; prompt logic must check for `--yes` before any `inquirer` call.

## Impact

- **`packages/arkenv-cli`**: Core flag parsing, prompt orchestration, and scaffold output are all affected.
- **`.agent/skills/arkenv/SKILL.md`**: New "Agent Setup" section added to guide AI agents toward the CLI rather than manual scaffolding.
- **No breaking changes**: All new flags are opt-in; interactive behaviour is unchanged when flags are absent.
- **Dependencies**: No new runtime dependencies anticipated; existing `inquirer`/`ora` calls gated behind flag checks.
