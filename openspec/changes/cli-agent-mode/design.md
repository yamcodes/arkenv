## Context

AI-native developers and platform engineers have different onboarding preferences. Platform engineers prefer traditional CLI control, while AI-native developers prefer agents to handle setup. `@arkenv/cli` currently uses interactive prompts and rich ANSI output (via `@clack/prompts`), which are difficult for AI agents to parse and interact with reliably. This design addresses these issues by adding machine-readable modes and updating AI agent instructions.

## Goals / Non-Goals

**Goals:**
- Make `@arkenv/cli init` fully automatable via a `--yes` flag.
- Provide an `--agent` flag as a high-level alias for non-interactive, machine-readable execution.
- Provide a plain-text output mode via `--quiet` to reduce token consumption and improve agent reliability.
- Provide a structured JSON output mode via `--json` for definitive success verification.
- Update the ArkEnv AI skill to prefer CLI-based initialization over manual file scaffolding.
- Integrate the AI skill installation into the CLI flow.

**Non-Goals:**
- Changing the default interactive behavior for human users.
- Supporting JSON/Quiet modes for all future CLI commands (scoped to `init` for now).
- Replacing `@clack/prompts` for interactive use.

## Decisions

### 1. Global Flag Parsing in `index.ts`
We will parse `--yes`/`-y`, `--agent`, `--quiet`, and `--json` at the entry point. 
- **Rationale**: These flags affect the entire execution flow (prompting, logging, and final output).
- **Alternatives**: Parsing in `runPromptWizard` or `scaffold`. Rejected because `index.ts` already handles `--help` and basic flag detection.

### 2. Composable Output Modes
- `--quiet`: Disables spinners (`ora`/`clack`), suppresses `picocolors` ANSI sequences, and limits output to high-level status messages.
- `--json`: Implies `--quiet` and `--yes`. 
    - **Ruthless Redirection**: To ensure the JSON is parseable by agents, ALL non-essential logs, status updates, and errors SHALL be redirected to `stderr`. Only the final JSON payload goes to `stdout`.
    - **Structured Schema**: The JSON output will follow a consistent schema for both success and failure: `{ "status": "success" | "error", "message": "string", "details": { ... } }`.
- `--agent`: A shorthand for `--yes --quiet`. It can be combined with `--json`.
- **Rationale**: Allows users/agents to choose the level of verbosity and structure they need.

### 3. "Agent Mode" for `@clack/prompts`
We will create a lightweight logger wrapper or utility that checks the `--quiet` and `--json` flags.
- **ANSI Stripping**: In agent/quiet mode, the wrapper will intercept calls to animated components (like spinners) and fall back to standard `console.error` (for status) or `console.log` (if not in JSON mode). This avoids emitting cursor manipulation ANSI sequences (\x1B[2K\x1B[1G) that waste tokens and confuse agents.
- **Rationale**: Directly calling `log.info` or `spinner()` everywhere makes it hard to suppress output globally. A wrapper ensures consistency.

### 4. Updating `SKILL.md` with CLI Instructions
The `yamcodes/arkenv` skill will be updated to explicitly recommend `pnpm dlx @arkenv/cli@latest init --agent`.
- **Rationale**: Leveraging the CLI's native logic is more reliable and token-efficient than the LLM trying to replicate complex scaffolding logic.

### 5. AI Skill Installation Prompt
In interactive mode, a new prompt will ask if the user wants to install the AI skill.
- **Rationale**: Improves discoverability of the agent-in-the-loop paradigm for traditional users.

## Risks / Trade-offs

- **[Risk]** Spinner suppression might make the CLI feel "stuck" to a human user if they accidentally pass `--quiet`. → **Mitigation**: Ensure `--quiet` still prints high-level milestones (e.g., "Starting...", "Done.") to `stderr`.
- **[Risk]** JSON output might be polluted by other logs. → **Mitigation**: Enforce that ALL output except the final JSON is sent to `stderr`. This includes error messages and "rogue" logs from sub-dependencies.
- **[Risk]** Maintaining two output paths (CLI vs JSON) adds complexity. → **Mitigation**: Use a centralized result object that is either formatted for the console or serialized to JSON.
