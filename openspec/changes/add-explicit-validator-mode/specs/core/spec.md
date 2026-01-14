# Capability: core

The core capability of ArkEnv provides environment variable validation and parsing.

## ADDED Requirements

### Requirement: Explicit Validator Mode
ArkEnv MUST support an explicit `validator` configuration option to choose between ArkType and Standard Schema validation.

#### Scenario: Default mode is ArkType
- **WHEN** `createEnv` is called without a `validator` option
- **THEN** it SHOULD use ArkType for validation
- **AND** it SHOULD support ArkType-specific features like string DSL and `type()`

#### Scenario: Standard mode validates without ArkType
- **WHEN** `createEnv` is called with `validator: "standard"`
- **THEN** it MUST NOT attempt to load or use ArkType
- **AND** it MUST successfully validate using Standard Schema validators (e.g., Zod)
- **AND** it MUST work even if ArkType is not installed

#### Scenario: Missing ArkType throws error
- **WHEN** `createEnv` is called with `validator: "arktype"` (or default)
- **AND** ArkType is not installed
- **THEN** it MUST throw a clear, actionable error message explaining that ArkType is required for this mode

### Requirement: Standard Mode Restrictions
In `standard` mode, ArkEnv MUST only accept object mappings of Standard Schema validators.

#### Scenario: Rejecting ArkType strings in standard mode
- **WHEN** `createEnv` is called with `validator: "standard"`
- **AND** the schema contains a string (ArkType DSL)
- **THEN** it SHOULD fail or ignore it (if not a valid validator)

### Requirement: Coercion in Standard Mode
Standard mode MUST still support environment variable coercion if enabled.

#### Scenario: Coercion works in standard mode
- **WHEN** `createEnv` is called with `validator: "standard"` and `coerce: true`
- **AND** a key is defined with a validator that expects a number
- **AND** the environment variable is a string "123"
- **THEN** it SHOULD be coerced to 123 before validation if the internal coercion logic is compatible
