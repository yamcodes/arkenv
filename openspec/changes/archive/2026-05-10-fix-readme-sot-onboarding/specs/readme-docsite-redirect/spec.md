## ADDED Requirements

### Requirement: Package READMEs are minimal npm landing pages
Each package README (`packages/arkenv/README.md`, `packages/vite-plugin/README.md`, `packages/bun-plugin/README.md`, `packages/cli/README.md`) SHALL contain only: package name heading, one-sentence description, a "Read the docs" link to the corresponding docsite page, a minimal install snippet, and a "Related" section. They SHALL NOT contain standalone Quickstart walkthroughs, feature lists, or usage examples that duplicate docsite content.

#### Scenario: Developer views the arkenv package on npm
- **WHEN** a developer visits the `arkenv` package on `npmjs.com`
- **THEN** they see a one-liner description, the install command, and a link to `arkenv.js.org/docs/arkenv`

#### Scenario: Developer views the vite-plugin package on npm
- **WHEN** a developer visits `@arkenv/vite-plugin` on `npmjs.com`
- **THEN** they see a one-liner description, the install command, and a link to `arkenv.js.org/docs/vite-plugin`

#### Scenario: Developer views the bun-plugin package on npm
- **WHEN** a developer visits `@arkenv/bun-plugin` on `npmjs.com`
- **THEN** they see a one-liner description, the install command, and a link to `arkenv.js.org/docs/bun-plugin`

#### Scenario: Developer views the cli package on npm
- **WHEN** a developer visits `@arkenv/cli` on `npmjs.com`
- **THEN** they see a one-liner description, the run command, and a link to `arkenv.js.org/docs/cli`

### Requirement: No onboarding content is duplicated between READMEs and docsite
For each package, the README and the corresponding docsite page SHALL NOT contain the same prose sections (Quickstart steps, feature bullets, usage code blocks that exist verbatim in both places).

#### Scenario: README is compared to its docsite counterpart
- **WHEN** `packages/arkenv/README.md` is compared to `apps/www/content/docs/arkenv/quickstart.mdx`
- **THEN** there SHALL be no shared prose sections or duplicate code examples
