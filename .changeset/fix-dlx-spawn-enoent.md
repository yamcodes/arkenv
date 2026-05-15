---
"@arkenv/cli": patch
---

#### Fix `spawn` ENOENT error for multi-word dlx commands

Fixed an issue where the CLI failed to install the ArkEnv agent skill using package managers like `pnpm` or `yarn` (e.g., `pnpm dlx`). The CLI now correctly splits the dlx command and its arguments when calling Node's `spawn` with `shell: false`.