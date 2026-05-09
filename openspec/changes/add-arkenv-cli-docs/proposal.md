## Why

The `@arkenv/cli` was recently introduced to provide an interactive, zero-dependency scaffolding experience for the Arkenv ecosystem. Currently, there is no official documentation guiding users on how to install, use, and benefit from this CLI tool. Adding clear documentation is necessary to ensure developers can seamlessly adopt the CLI for generating validation schemas and type-safe environment configurations.

## What Changes

- Add a comprehensive `README.md` to `packages/arkenv-cli` detailing its usage, commands, and options.
- Create a dedicated documentation section in the primary docs site (`apps/www/content/docs/cli`) covering installation, usage patterns, and framework integrations.
- Add `npx @arkenv/cli@latest init` command to the landing page next to the quickstart button.
- Integrate the `@arkenv/cli` documentation into the main sidebar adjacent to other package sections.
- Update `apps/www/content/docs/meta.json` to include the new `cli` section in the navigation menu.

## Capabilities

### New Capabilities
- `cli-documentation`: Establishing comprehensive documentation for the `@arkenv/cli` command, including README and online docs site pages.

### Modified Capabilities

## Impact

- `packages/arkenv-cli`: New `README.md` added.
- `apps/www/content/docs/cli`: New folder and MDX documentation files added.
- `apps/www/content/docs/meta.json`: Navigation updated to link to the new CLI docs.
