# coercion Specification

## Purpose
Define the stable coercion mechanism using public ArkType APIs for environment variable type transformation. This specification documents goals, scope, and migration guidance following the archive of coercion-public-api. The coercion mechanism preserves support for numeric refinements (ranges and divisors) while maintaining strictness for numeric literals.

## Requirements
### Requirement: Coerce numeric strings to numbers
The system MUST coerce environment variable strings to numbers when the schema definition specifies `number` or a `number.*` subtype.

#### Scenario: Basic number coercion
- **GIVEN** a schema `{ PORT: "number" }`
- **AND** an environment `{ PORT: "3000" }`
- **WHEN** `arkenv` parses the environment
- **THEN** the result should contain `PORT` as the number `3000`.

### Requirement: Support numeric refinements
The system MUST support numeric refinements (ranges, divisors) on coerced environment variables.

#### Scenario: Range coercion
- **GIVEN** a schema `{ AGE: "number >= 18" }`
- **AND** an environment `{ AGE: "21" }`
- **WHEN** `arkenv` parses the environment
- **THEN** the result should contain `AGE` as the number `21`.

#### Scenario: Range failure
- **GIVEN** a schema `{ AGE: "number >= 18" }`
- **AND** an environment `{ AGE: "15" }`
- **WHEN** `arkenv` parses the environment
- **THEN** it should return a validation error indicating `AGE` must be at least 18.

#### Scenario: Divisor coercion
- **GIVEN** a schema `{ EVEN: "number % 2" }`
- **AND** an environment `{ EVEN: "4" }`
- **WHEN** `arkenv` parses the environment
- **THEN** the result should contain `EVEN` as the number `4`.

### Requirement: Coerce boolean strings to booleans
The system MUST coerce environment variable strings "true" and "false" to boolean values when the schema definition specifies `boolean`.

#### Scenario: Boolean coercion
- **GIVEN** a schema `{ DEBUG: "boolean" }`
- **AND** an environment `{ DEBUG: "true" }`
- **WHEN** `arkenv` parses the environment
- **THEN** the result should contain `DEBUG` as the boolean `true`.

### Requirement: Coercion for numeric literals
The system MUST coerce environment variable strings to numbers when the schema definition specifies a numeric literal.

#### Scenario: Literal coercion
- **GIVEN** a schema `{ VERSION: "1 | 2" }`
- **AND** an environment `{ VERSION: "1" }`
- **WHEN** `arkenv` parses the environment
- **THEN** the result should contain `VERSION` as the number `1`.

### Requirement: Support schemas with morphs (pipes)
The system MUST support schemas that contain ArkType morphs (pipes). Coercion logic MUST only inspect the input side of the schema to avoid errors.

#### Scenario: Coercion with manual morph
- **GIVEN** a schema `{ PORT: "number", MANUAL: type("string").pipe(Number) }`
- **AND** an environment `{ PORT: "3000", MANUAL: "456" }`
- **WHEN** `arkenv` parses the environment
- **THEN** the result should contain `PORT` as number `3000`
- **AND** `MANUAL` as number `456`.


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

