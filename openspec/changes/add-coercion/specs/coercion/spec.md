# Spec: Coercion

## ADDED Requirements

### Requirement: Coerce numeric strings to numbers
The system MUST coerce environment variable strings to numbers when the schema definition specifies `number` or a `number.*` subtype.

#### Scenario: Basic number coercion
Given a schema `{ PORT: "number" }`
And an environment `{ PORT: "3000" }`
When `arkenv` parses the environment
Then the result should contain `PORT` as the number `3000`

#### Scenario: Number subtype coercion
Given a schema `{ TIMESTAMP: "number.epoch" }`
And an environment `{ TIMESTAMP: "1640995200000" }`
When `arkenv` parses the environment
Then the result should contain `TIMESTAMP` as the number `1640995200000`

### Requirement: Coerce boolean strings to booleans
The system MUST coerce environment variable strings "true" and "false" to boolean values when the schema definition specifies `boolean`.

#### Scenario: Boolean true coercion
Given a schema `{ DEBUG: "boolean" }`
And an environment `{ DEBUG: "true" }`
When `arkenv` parses the environment
Then the result should contain `DEBUG` as the boolean `true`

#### Scenario: Boolean false coercion
Given a schema `{ DEBUG: "boolean" }`
And an environment `{ DEBUG: "false" }`
When `arkenv` parses the environment
Then the result should contain `DEBUG` as the boolean `false`

### Requirement: Pass through non-coercible values
The system MUST pass through values unchanged if they do not match a coercible type definition or if coercion fails (letting ArkType handle the validation error).

#### Scenario: String pass-through
Given a schema `{ API_KEY: "string" }`
And an environment `{ API_KEY: "12345" }`
When `arkenv` parses the environment
Then the result should contain `API_KEY` as the string `"12345"`
