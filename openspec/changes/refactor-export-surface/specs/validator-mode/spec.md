## ADDED Requirements

### Requirement: Dedicated Standard Entry Point
In addition to the `validator: "standard"` option on the main `arkenv` entry's `createEnv`, ArkEnv MUST provide a dedicated `arkenv/standard` entry whose `createEnv` operates exclusively in Standard Schema mode without requiring ArkType.

#### Scenario: arkenv/standard createEnv validates using Standard Schema
- **WHEN** `createEnv` is imported from `arkenv/standard`
- **AND** called with an object mapping of Standard Schema validators
- **THEN** it MUST validate the environment variables using those validators
- **AND** it MUST return the validated output typed by the Standard Schema output types

#### Scenario: arkenv/standard createEnv rejects non-standard validators
- **WHEN** `createEnv` is imported from `arkenv/standard`
- **AND** called with a schema value that lacks a `~standard` property
- **THEN** it MUST throw an `ArkEnvError` indicating an invalid Standard Schema validator

#### Scenario: arkenv/standard createEnv rejects ArkType DSL strings
- **WHEN** `createEnv` is imported from `arkenv/standard`
- **AND** called with a schema containing a string value (ArkType DSL)
- **THEN** it MUST throw an `ArkEnvError` indicating that ArkType DSL strings are not supported
