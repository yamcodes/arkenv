# Spec: Coercion

## ADDED Requirements

### Requirement: Coerce numeric strings to numbers
The system MUST coerce environment variable strings to numbers when the schema definition specifies `number` or a `number.*` subtype.

#### Scenario: Basic number coercion
**WHEN** a schema `{ PORT: "number" }` is parsed with environment `{ PORT: "3000" }`
**THEN** the result should contain `PORT` as the number `3000`

### Requirement: Support numeric refinements
The system MUST support numeric refinements (ranges, divisors) on coerced environment variables.

#### Scenario: Range coercion
**WHEN** a schema `{ AGE: "number >= 18" }` is parsed with environment `{ AGE: "21" }`
**THEN** the result should contain `AGE` as the number `21`

#### Scenario: Range failure
**WHEN** a schema `{ AGE: "number >= 18" }` is parsed with environment `{ AGE: "15" }`
**THEN** it should return a validation error indicating `AGE` must be at least 18

#### Scenario: Divisor coercion
**WHEN** a schema `{ EVEN: "number % 2" }` is parsed with environment `{ EVEN: "4" }`
**THEN** the result should contain `EVEN` as the number `4`

### Requirement: Coerce boolean strings to booleans
The system MUST coerce environment variable strings "true" and "false" to boolean values when the schema definition specifies `boolean`.

#### Scenario: Boolean coercion
**WHEN** a schema `{ DEBUG: "boolean" }` is parsed with environment `{ DEBUG: "true" }`
**THEN** the result should contain `DEBUG` as the boolean `true`

### Requirement: Strictness by default for literals
The system MUST NOT coerce strings to numbers for literal types unless explicitly specified, preserving standard ArkType strictness.

#### Scenario: Literal strictness
**WHEN** a schema `{ VERSION: "1 | 2" }` is parsed with environment `{ VERSION: "1" }`
**THEN** it should return a validation error (string "1" is not number 1)
