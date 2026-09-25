---
"arkenv": minor
---

#### Stop installing the agent skill during init

`arkenv init` no longer prompts for or installs the ArkEnv agent skill, including under `--yes`. The skill is installed with `npx skills add yamcodes/arkenv`, or through `@arkenv/agent-plugin`.
