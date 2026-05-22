# internal-types Specification

## Purpose
The internal types package provides common TypeScript types shared across multiple packages in the ArkEnv monorepo. It eliminates code duplication and provides a single source of truth for shared type definitions like `InferType`. The package is marked as private and is not published to npm, but types are bundled into consuming packages during build using tsdown's `dts.resolve` configuration to avoid dependency issues.
## Requirements
### Requirement: Internal Types Package

The project SHALL provide an internal types package (`@repo/types`) that exports common TypeScript types shared across multiple packages. This package SHALL NOT be published to npm and is intended for internal use only within the monorepo.

#### Scenario: InferType is exported from internal types package
- **WHEN** a package needs to use the `InferType` type
- **THEN** it can import `InferType` from `@repo/types`
- **AND** the type definition is consistent across all packages using it
- **AND** there is a single source of truth for the type definition

#### Scenario: Internal types package is not published
- **WHEN** the internal types package is built
- **THEN** it is not included in npm publishing
- **AND** it is only available within the monorepo via workspace protocol
- **AND** external users cannot depend on it

#### Scenario: Types are properly exported
- **WHEN** the internal types package is built
- **THEN** all exported types are available via the package's main entry point
- **AND** TypeScript can properly resolve and use the types
- **AND** the types work correctly with workspace protocol dependencies

#### Scenario: Internal types package is included in workflows
- **WHEN** changes are made to `packages/internal/types/`
- **THEN** relevant workflows (build, test, typecheck) are triggered
- **AND** the package is built and tested as part of the CI/CD pipeline
- **AND** the package is excluded from npm publishing workflows

