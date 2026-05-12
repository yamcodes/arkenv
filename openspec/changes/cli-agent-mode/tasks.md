## 1. CLI Core Enhancement

- [ ] 1.1 Update `packages/cli/src/index.ts` to parse `--quiet` (`-q`), `--json` (`-j`), and `--agent` (`-a`) flags.
- [ ] 1.2 Implement a `Logger` utility in `packages/cli/src/visuals.ts` or a new file that respects the new flags and aliases.
- [ ] 1.3 Refactor `packages/cli/src/index.ts` to use the new `Logger` instead of direct `console.log` or `@clack/prompts` logging.
- [ ] 1.4 Update `help` text in `packages/cli/src/index.ts` to include the new flags and their aliases (`-y`, `-a`, `-q`, `-j`).

## 2. Non-Interactive Logic

- [ ] 2.1 Update `runPromptWizard` in `packages/cli/src/prompts.ts` to support bypassing prompts when `--yes` is active (mostly done, but verify).
- [ ] 2.2 Add the "Install AI Skill" prompt to `runPromptWizard` and gate it behind interactive mode.
- [ ] 2.3 Implement the skill installation execution in `packages/cli/src/index.ts`.

## 3. Output Formatting

- [ ] 3.1 Implement `--quiet` mode by suppressing spinners and stripping ANSI colors from the new `Logger`.
- [ ] 3.2 Implement `--json` mode with a structured schema `{ "status": "success" | "error", "message": string, "details": { ... } }`.
- [ ] 3.3 Implement `--agent` as a macro that enables `--yes`, `--quiet`, and `--json`.
- [ ] 3.4 Ensure flags are independent: `--json` can be used interactively (UI redirected to `stderr`).
- [ ] 3.5 Enforce "ruthless" redirection of all non-JSON output (logs, status, warnings, prompts) to `stderr` when `--json` is active.
- [ ] 3.6 Ensure failure states are captured and emitted as a structured JSON object to `stdout` before process exit.


## 4. AI Skill Update

- [ ] 4.1 Update `.agent/skills/arkenv/SKILL.md` (or relevant skill file) to include the "Agent Setup" section.
- [ ] 4.2 Document the use of `--yes`, `--quiet`, and `--json` for AI agents in the skill.

## 5. Verification & Testing

- [ ] 5.1 Add smoke tests for `arkenv init --yes`.
- [ ] 5.2 Add smoke tests for `arkenv init --quiet`.
- [ ] 5.3 Add smoke tests for `arkenv init --agent`.
- [ ] 5.4 Add smoke tests for `arkenv init --json` and verify JSON structure.
- [ ] 5.5 Verify the AI skill installation prompt works correctly in interactive mode.
