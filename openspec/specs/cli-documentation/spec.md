# cli-documentation Specification

## Purpose
TBD - created by archiving change add-arkenv-cli-docs. Update Purpose after archive.
## Requirements
### Requirement: CLI README

The `packages/arkenv-cli` package MUST contain a `README.md` file that provides installation and usage instructions.

#### Scenario: User visits npm registry or GitHub
- **WHEN** user views the `@arkenv/cli` package page
- **THEN** they see documentation explaining how to run `pnpm dlx @arkenv/cli@latest init` and basic scaffolding capabilities

### Requirement: CLI Website Documentation

The Fumadocs website in `apps/www` MUST contain a new documentation page for the CLI at `/docs/cli`.

#### Scenario: User navigates documentation site
- **WHEN** user clicks on "CLI" in the sidebar navigation
- **THEN** they are presented with detailed documentation on how to use `@arkenv/cli init`, including supported options and validation schemas

### Requirement: Landing Page CLI Command

The landing page (`apps/www/app/(home)/page.tsx`) MUST display the initialization command for the CLI.

#### Scenario: User visits the landing page
- **WHEN** the user views the hero section
- **THEN** they see `npx @arkenv/cli@latest init` displayed prominently next to the quickstart button

### Requirement: Sidebar Navigation Position

The CLI documentation MUST be positioned adjacent to other core package documentations in the sidebar.

#### Scenario: User views the documentation sidebar
- **WHEN** the user loads the documentation site
- **THEN** the sidebar displays "CLI" in the main navigation list, grouped with "arkenv", "Vite Plugin", and "Bun Plugin"

