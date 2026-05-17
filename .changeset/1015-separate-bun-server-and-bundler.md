---
"@arkenv/cli": minor
---

#### Refine Bun detection and scaffolding in `arkenv init`

The `arkenv init` command now distinguishes between Vanilla Bun runtime usage and fullstack/frontend bundling via Bun's dev server (`Bun.serve`) or programmatic Bundler (`Bun.build`).

- **Refined Detection**: Automatically detect usage of `Bun.serve` or `Bun.build` in your project.
- **Improved Wizard Flow**: For Bun projects, the wizard now defaults to a **Vanilla** runtime-only integration. Use the optional multi-select step to enable `@arkenv/bun-plugin` only when build-time inlining of `PUBLIC_` variables is required for full-stack or frontend code.
- **Composable Scaffolding**: 
    - **Vanilla integration** provides instructions for type-safe usage via the `env` object.
    - **Fullstack dev server integration** provides configuration for `bunfig.toml`.
    - **Programmatic Bundler integration** provides snippets for custom build scripts.
