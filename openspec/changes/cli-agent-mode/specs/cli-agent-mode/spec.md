## ADDED Requirements

### Requirement: Agent-First Instructions
The ArkEnv skill SHALL explicitly instruct AI agents to use the CLI for initialization rather than manual file creation.

#### Scenario: Agent reads skill instructions
- **WHEN** an AI agent parses the ArkEnv skill
- **THEN** it SHALL find a directive to run `pnpm dlx @arkenv/cli@latest init --agent` for project setup
- **AND** it SHALL find guidance on using `--json` for better observability
