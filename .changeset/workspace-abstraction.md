---
"@arkenv/cli": patch
---

#### Robust project configuration and comment preservation

Improved how the CLI modifies project files to be more respectful of user configuration:
- **Preserve Comments and Formatting**: Updating `tsconfig.json` now uses a non-destructive parser that preserves your comments, indentation, and existing formatting.
- **Reliable Plugin Injection**: Injection of ArkEnv plugins into `vite.config.ts` and `bun.config.ts` now uses AST-based manipulation, making it much more robust against varied coding styles and existing configurations.
- **Improved Atomic Writes**: File system operations now use a more centralized and tested abstraction, reducing the risk of file corruption during scaffolding.
