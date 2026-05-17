---
"@arkenv/cli": minor
---

#### Refine Bun detection and scaffolding in `arkenv init`

The `arkenv init` command now distinguishes between standard Bun runtime usage and fullstack/frontend bundling via Bun's dev server (`Bun.serve`) or programmatic Bundler (`Bun.build`).

- **Refined Detection**: Automatically detect usage of `Bun.serve` or `Bun.build` in your project.
- **Improved Wizard Flow**: For Bun projects, the wizard now defaults to a standard runtime-only integration. Use the optional multi-select step to enable `@arkenv/bun-plugin` only when build-time inlining of `PUBLIC_` variables is required for fullstack or frontend code.
- **Composable Scaffolding**: 
    - Standard integration provides instructions for direct `process.env` usage.
    - Fullstack dev server integration provides configuration for `bunfig.toml`.
    - Programmatic Bundler integration provides snippets for custom build scripts.
