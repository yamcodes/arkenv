## MODIFIED Requirements

### Requirement: Internal Types Package

The project SHALL provide an internal types package (`@repo/types`) that exports common TypeScript types shared across multiple packages. This package SHALL NOT be published to npm and is intended for internal use only within the monorepo. The package SHALL NOT require a build step and SHALL export types directly from source `.ts` files.

#### Scenario: InferType is exported from internal types package
- **WHEN** a package needs to use the `InferType` type
- **THEN** it can import `InferType` from `@repo/types`
- **AND** the type definition is consistent across all packages using it
- **AND** there is a single source of truth for the type definition
- **AND** no build step is required to use the types

#### Scenario: Internal types package is not published
- **WHEN** the internal types package is used
- **THEN** it is not included in npm publishing
- **AND** it is only available within the monorepo via workspace protocol
- **AND** external users cannot depend on it

#### Scenario: Types are properly exported from source files
- **WHEN** the internal types package is used
- **THEN** all exported types are available via the package's main entry point (`index.ts`)
- **AND** TypeScript can properly resolve and use the types from source files
- **AND** the types work correctly with workspace protocol dependencies
- **AND** no build step is required to generate declaration files

#### Scenario: Internal types package has no build step
- **WHEN** the internal types package is used
- **THEN** it does not require a build step to generate declaration files
- **AND** types are resolved directly from source `.ts` files
- **AND** the package.json points to source files (not `dist/` directory)
- **AND** consuming packages can resolve types without building the internal types package first

#### Scenario: Internal types package is included in workflows
- **WHEN** changes are made to `packages/internal/types/`
- **THEN** relevant workflows (typecheck, test) are triggered
- **AND** the package is type-checked and tested as part of the CI/CD pipeline
- **AND** the package is excluded from npm publishing workflows
- **AND** the package is excluded from build workflows (no build step needed)

