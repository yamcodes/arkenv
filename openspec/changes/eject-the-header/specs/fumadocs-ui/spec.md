## MODIFIED Requirements

### Requirement: ArkEnv MDX Components
The theme MUST provide a pre-configured mapping of MDX components.

#### Scenario: Component Registration
- **WHEN** `arkenvComponents` is imported
- **THEN** it MUST include overrides for `a`, `h1`, `h2`, `h3`, and `pre`

### Requirement: Header Export
The `@arkenv/fumadocs-ui` package MUST export the `Header` component from its `components` entry point alongside existing component exports.

#### Scenario: Named export
- **WHEN** a consumer does `import { Header } from "@arkenv/fumadocs-ui/components"`
- **THEN** `Header` MUST be the React component defined in `src/components/header.tsx`
