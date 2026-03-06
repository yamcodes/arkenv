## ADDED Requirements

### Requirement: Header Export
The `@arkenv/fumadocs-ui` package MUST export the `Header` component from its `components` entry point alongside existing component exports.

#### Scenario: Named export
- **WHEN** a consumer does `import { Header } from "@arkenv/fumadocs-ui/components"`
- **THEN** `Header` MUST be the React component defined in `src/components/header.tsx`
