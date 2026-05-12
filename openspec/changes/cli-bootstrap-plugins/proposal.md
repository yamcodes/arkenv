## Why

Currently, when scaffolding a new ArkEnv setup, the CLI intelligently installs the appropriate framework plugin (e.g., `@arkenv/vite-plugin` or `@arkenv/bun-plugin`). However, users must still manually update their framework configuration files to import and register the plugin. Automatically bootstrapping the plugin into the framework configuration file removes this manual step, streamlining the onboarding experience and reducing the chance of user error.

## What Changes

- **Plugin Configuration Injection**: When a supported framework (Vite, Bun) is detected and its corresponding plugin is installed, the CLI will attempt to automatically inject the plugin into the framework's configuration file (e.g., `vite.config.ts` or `bunfig.toml` / runtime entry).
- **Graceful Fallback**: If the configuration file cannot be safely modified (e.g., complex AST or non-standard structure), the CLI will gracefully fallback to providing clear manual instructions.

## Capabilities

### New Capabilities
- `plugin-bootstrapping`: The ability to parse, modify, and rewrite framework configuration files to inject ArkEnv plugins safely.

### Modified Capabilities
- `scaffolding-cli`: The scaffolding workflow is expanding to include a configuration mutation step after dependency installation.

## Impact

- **CLI Package**: New AST parsing/manipulation dependencies may be needed (or simple regex replacement logic) in the `@arkenv/cli` package.
- **Developer Experience**: Significantly improved time-to-first-success by automating the final step of plugin integration.
