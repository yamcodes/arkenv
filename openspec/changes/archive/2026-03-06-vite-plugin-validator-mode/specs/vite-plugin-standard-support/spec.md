# spec.md (Delta)

## ADDED Requirements

### Requirement: Vite Plugin Validator Support

The Vite plugin SHALL support choosing between validator engines to enable usage in environments without ArkType.

#### Scenario: Configuring validator mode in Vite
- **WHEN** `arkenv()` plugin is configured with `validator: "standard"`
- **THEN** it MUST pass this option to the underlying `createEnv` call
- **AND** it MUST NOT attempt to load ArkType
- **AND** it MUST work even if ArkType is not installed

#### Scenario: Inference from Standard Schema in Vite
- **WHEN** a Vite project uses a Standard Schema validator with `validator: "standard"`
- **THEN** `import.meta.env` properties MUST be correctly inferred from the validator's output types
- **AND** this inference MUST work without `arktype` being present

#### Scenario: Support for custom arkenv config in Vite
- **WHEN** a user provides a configuration object as the second argument to `arkenv()`
- **THEN** options like `coerce`, `onUndeclaredKey`, and `arrayFormat` MUST be respected
