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

### Requirement: Coercion for numeric literals
The system MUST coerce environment variable strings to numbers when the schema definition specifies a numeric literal.

#### Scenario: Literal coercion
**WHEN** a schema `{ VERSION: "1 | 2" }` is parsed with environment `{ VERSION: "1" }`
**THEN** the result should contain `VERSION` as the number `1`
