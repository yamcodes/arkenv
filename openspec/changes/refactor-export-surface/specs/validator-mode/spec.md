## ADDED Requirements

### Requirement: Dedicated Standard Entry Point
ArkEnv MUST provide a dedicated `arkenv/standard` entry whose `createEnv` operates exclusively in Standard Schema mode without requiring ArkType. The `validator: "standard"` option on the main `arkenv` entry's `createEnv` MUST be removed in favor of this dedicated entry point.

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

#### Scenario: arkenv/standard works at runtime without ArkType installed
- **WHEN** `createEnv` is imported from `arkenv/standard`
- **AND** the runtime or bundle does not have ArkType present (ArkType is not installed)
- **THEN** it MUST successfully validate the environment variables using the provided Standard Schema validators and return the typed output without throwing any errors
- **NOTE** validated by `bundling-interop.test.ts`: the ESM bundle generated from `arkenv/standard` must contain no `"arktype"` string references and must run successfully in an environment where `arktype` is absent
