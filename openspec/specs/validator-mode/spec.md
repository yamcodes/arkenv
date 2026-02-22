# validator-mode Specification

## Purpose
ArkEnv provides two entry points for different validation needs. The default `arkenv` entry runs validation through ArkType, while `arkenv/standard` provides an ArkType-free path for projects that prefer Standard Schema validators exclusively.

## Requirements
### Requirement: Dedicated Entry Points
ArkEnv MUST provide separate entry points to choose between ArkType and Standard Schema validators.

#### Scenario: Default entry uses ArkType
- **WHEN** importing from `arkenv`
- **THEN** it SHOULD use ArkType for validation
- **AND** it SHOULD support ArkType-specific features like string DSL and `type()`

#### Scenario: Standard entry validates without ArkType
- **WHEN** importing from `arkenv/standard`
- **THEN** it MUST NOT attempt to load or use ArkType
- **AND** it MUST successfully validate using Standard Schema validators
- **AND** it MUST work even if ArkType is not installed

#### Scenario: Missing ArkType throws error
- **WHEN** importing from `arkenv`
- **AND** ArkType is not installed
- **THEN** it MUST throw a clear, actionable error message explaining that ArkType is required

### Requirement: Standard Entry Restrictions
In `arkenv/standard`, ArkEnv MUST only accept object mappings of Standard Schema validators.

#### Scenario: Rejecting ArkType strings in standard entry
- **WHEN** `createEnv` from `arkenv/standard` is called
- **AND** the schema contains a string (ArkType DSL)
- **THEN** it MUST fail with a clear error indicating that ArkType DSL strings are not supported

#### Scenario: Reject non-standard validators in standard entry
- **WHEN** `createEnv` from `arkenv/standard` is called
- **AND** a schema value does not expose `~standard`
- **THEN** it MUST fail with an error indicating an invalid Standard Schema validator
