# coercion-refactor Specification

## Purpose
TBD - created by archiving change coercion-public-api. Update Purpose after archive.
## Requirements
### Requirement: Stable Introspection
The coercion system MUST identify target fields using only public ArkType APIs (`schema.in.toJsonSchema`).

#### Scenario: Identify nested numeric paths
- **GIVEN** a schema `{ API: { PORT: "number", TIMEOUT: "number?" } }`
- **WHEN** building the coercion map
- **THEN** it MUST identify `API.PORT` and `API.TIMEOUT` as numeric coercion targets via the `toJsonSchema` structure.

### Requirement: Pipeline-based Coercion
The coercion mechanism MUST be implemented as a data pre-processing morph using `type.pipe` instead of internal schema mutation.

#### Scenario: Coercion in pipeline
- **GIVEN** a coerced schema `const Coerced = arkenv(type({ PORT: "number" }))`
- **WHEN** validated with `{ PORT: "3000" }`
- **THEN** it MUST apply the coercion within the ArkType pipeline and return `{ PORT: 3000 }`.
- **AND** it MUST NOT rely on `.internal` or `.transform` methods during the process.

