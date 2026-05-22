# Standard Mode Inference Specification

## ADDED Requirements

### Requirement: Standard Mode Type Inference
When `createEnv` is used with `validator: "standard"`, the returned object MUST have types inferred from the Standard Schema validators.

#### Scenario: Zod inference in Standard Mode
- **GIVEN** a schema object containing Zod validators (which implement Standard Schema)
- **WHEN** `createEnv` is called with `validator: "standard"`
- **THEN** the returned object MUST have types exactly matching the Zod output types
- **AND** it MUST NOT be wrapped in ArkType-specific inference types like `distill.Out`

#### Scenario: Inferred types are usable without ArkType
- **GIVEN** `validator: "standard"` is used
- **THEN** types of the returned environment object MUST NOT depend on ArkType types at the consumer level
