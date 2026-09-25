---
"arkenv": minor
---

#### Stop installing the agent skill during init

`arkenv init` no longer prompts for or installs the ArkEnv agent skill, including under `--yes`. When the skill is not already in the project, the next-steps note still prints `npx skills add yamcodes/arkenv`. `@arkenv/agent-plugin` already includes the skill.
