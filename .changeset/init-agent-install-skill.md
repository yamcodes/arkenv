---
"arkenv": patch
---

#### Install agent skill during `init --agent` when missing

`arkenv init --agent` now installs the ArkEnv agent skill when it is not already present (same as `--yes`), instead of skipping skill install.
