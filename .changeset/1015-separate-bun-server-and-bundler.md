---
"@arkenv/cli": minor
---

#### Refine Bun detection and scaffolding in `arkenv init`

The `arkenv init` command now distinguishes between Bun's Fullstack dev server (`Bun.serve`) and programmatic Bundler (`Bun.build`).

- **Refined Detection**: Automatically detect usage of `Bun.serve` or `Bun.build` in your project.
- **Interactive Wizard**: If Bun is detected, use the new multi-select step to choose exactly which Bun-specific APIs you want to integrate.
- **Composable Scaffolding**: 
    - Select `Bun.serve` to add the ArkEnv plugin to your `bunfig.toml`.
    - Select `Bun.build` to receive a code snippet for your programmatic build script.
    - If no specific Bun APIs are used, ArkEnv proceeds with a standard Node-compatible setup without the Bun plugin.
