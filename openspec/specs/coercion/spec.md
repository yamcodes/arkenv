# coercion Specification

## Purpose
Ensures that environment variables, which are natively strings, are automatically coerced into target types like `number` and `boolean` during validation. This coercion specifically preserves support for numeric refinements like ranges and divisors while maintaining strictness for numeric literals.
## Requirements
### Requirement: Coerce numeric strings to numbers
The system MUST coerce environment variable strings to numbers when the schema definition specifies `number` or a `number.*` subtype.

#### Scenario: Basic number coercion
Given a schema `{ PORT: "number" }`
And an environment `{ PORT: "3000" }`
When `arkenv` parses the environment
Then the result should contain `PORT` as the number `3000`

### Requirement: Support numeric refinements
The system MUST support numeric refinements (ranges, divisors) on coerced environment variables.

#### Scenario: Range coercion
Given a schema `{ AGE: "number >= 18" }`
And an environment `{ AGE: "21" }`
When `arkenv` parses the environment
Then the result should contain `AGE` as the number `21`

#### Scenario: Range failure
Given a schema `{ AGE: "number >= 18" }`
And an environment `{ AGE: "15" }`
When `arkenv` parses the environment
Then it should return a validation error indicating `AGE` must be at least 18

#### Scenario: Divisor coercion
Given a schema `{ EVEN: "number % 2" }`
And an environment `{ EVEN: "4" }`
When `arkenv` parses the environment
Then the result should contain `EVEN` as the number `4`

### Requirement: Coerce boolean strings to booleans
The system MUST coerce environment variable strings "true" and "false" to boolean values when the schema definition specifies `boolean`.

#### Scenario: Boolean coercion
Given a schema `{ DEBUG: "boolean" }`
And an environment `{ DEBUG: "true" }`
When `arkenv` parses the environment
Then the result should contain `DEBUG` as the boolean `true`

### Requirement: Coercion for numeric literals
The system MUST coerce environment variable strings to numbers when the schema definition specifies a numeric literal.

#### Scenario: Literal coercion
Given a schema `{ VERSION: "1 | 2" }`
And an environment `{ VERSION: "1" }`
When `arkenv` parses the environment
Then the result should contain `VERSION` as the number `1`

### Requirement: Support schemas with morphs (pipes)
The system MUST support schemas that contain ArkType morphs (pipes). Coercion should logic should only inspect the input side of the schema to avoid errors.

#### Scenario: Coercion with manual morph
Given a schema `{ PORT: "number", MANUAL: type("string").pipe(Number) }`
And an environment `{ PORT: "3000", MANUAL: "456" }`
When `arkenv` parses the environment
Then the result should contain `PORT` as number `3000`
And `MANUAL` as number `456`

