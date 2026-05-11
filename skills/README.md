# ArkEnv Agent Skills

This directory contains skills for AI agents to help them understand and use ArkEnv more effectively.

## Available Skills

- [**arkenv**](./arkenv/SKILL.md): Core ArkEnv usage, schema definition, and best practices.
- [**arkenv-cli**](./cli/SKILL.md): ArkEnv CLI commands and setup instructions.

## Installation

To add these skills to your AI agent (like Cursor, Claude Code, etc.), run:

```bash
# Add both skills
npx skills add yamcodes/arkenv --all

# Add only core arkenv skill
npx skills add yamcodes/arkenv --skill=arkenv
```

For more information about skills, visit [skills.sh](https://skills.sh).
