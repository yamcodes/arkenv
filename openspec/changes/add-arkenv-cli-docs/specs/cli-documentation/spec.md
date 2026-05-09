## ADDED Requirements

### Requirement: CLI README

The `packages/arkenv-cli` package MUST contain a `README.md` file that provides installation and usage instructions.

#### Scenario: User visits npm registry or GitHub
- **WHEN** user views the `@arkenv/cli` package page
- **THEN** they see documentation explaining how to run `pnpm dlx create-arkenv@latest` and basic scaffolding capabilities

### Requirement: CLI Website Documentation

The Fumadocs website in `apps/www` MUST contain a new documentation page for the CLI at `/docs/cli`.

#### Scenario: User navigates documentation site
- **WHEN** user clicks on "CLI" in the sidebar navigation
- **THEN** they are presented with detailed documentation on how to use `create-arkenv`, including supported options and validation schemas

### Requirement: Documentation Navigation Integration

The `apps/www/content/docs/meta.json` MUST be updated to include the `"cli"` page.

#### Scenario: User views the documentation sidebar
- **WHEN** the user loads the documentation site
- **THEN** the sidebar displays a link to the CLI documentation page
