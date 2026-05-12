## 1. CLI Core Enhancement

- [ ] 1.1 Update `packages/cli/src/index.ts` to parse `--quiet`, `--json`, and `--agent` flags.
- [ ] 1.2 Implement a `Logger` utility in `packages/cli/src/visuals.ts` or a new file that respects `--quiet`, `--json`, and `--agent`.
- [ ] 1.3 Refactor `packages/cli/src/index.ts` to use the new `Logger` instead of direct `console.log` or `@clack/prompts` logging.
- [ ] 1.4 Update `help` text in `packages/cli/src/index.ts` to include the new flags.

## 2. Non-Interactive Logic

- [ ] 2.1 Update `runPromptWizard` in `packages/cli/src/prompts.ts` to support bypassing prompts when `--yes` is active (mostly done, but verify).
- [ ] 2.2 Add the "Install AI Skill" prompt to `runPromptWizard` and gate it behind interactive mode.
- [ ] 2.3 Implement the skill installation execution in `packages/cli/src/index.ts`.

## 3. Output Formatting

- [ ] 3.1 Implement `--quiet` mode by suppressing spinners and stripping ANSI colors from the new `Logger`.
- [ ] 3.2 Implement `--json` mode by collecting all operation results and printing a single JSON object to `stdout`.
- [ ] 3.3 Ensure all non-essential output is redirected to `stderr` when `--json` is active.

## 4. AI Skill Update

- [ ] 4.1 Update `.agent/skills/arkenv/SKILL.md` (or relevant skill file) to include the "Agent Setup" section.
- [ ] 4.2 Document the use of `--yes`, `--quiet`, and `--json` for AI agents in the skill.

## 5. Verification & Testing

- [ ] 5.1 Add smoke tests for `arkenv init --yes`.
- [ ] 5.2 Add smoke tests for `arkenv init --quiet`.
- [ ] 5.3 Add smoke tests for `arkenv init --json` and verify JSON structure.
- [ ] 5.4 Verify the AI skill installation prompt works correctly in interactive mode.
rrectly in interactive mode.
ive mode.
