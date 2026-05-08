## Why

Currently, setting up ArkEnv requires manual configuration and copying patterns from examples. As the project expands to support multiple validators (ArkType, Zod, Valibot) and runtimes (Vite, Bun, Node), a standardized scaffolding tool is needed to ensure users can get started with a "best practices" setup in under a minute.

## What Changes

- Create a new package `packages/create-arkenv` that acts as an interactive CLI wizard.
- Implementation of a template-driven scaffolding engine.
- Support for selecting validator, framework/runtime, and language.

## Capabilities

### New Capabilities
- `scaffolding-cli`: An interactive wizard that scaffolds a working ArkEnv setup based on user preferences.

### Modified Capabilities
<!-- None -->

## Impact

- **New Package**: `packages/create-arkenv` added to the monorepo.
- **CLI Ecosystem**: Establishes the pattern for future Arkenv CLI tools.
- **Dependencies**: Introduces `@clack/prompts` as a dependency for the CLI package.
