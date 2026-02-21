## ADDED Requirements

### Requirement: Three-Tier Export Architecture
ArkEnv MUST expose exactly three public entry points — `arkenv`, `arkenv/standard`, and `arkenv/core` — each with a clearly defined contract.

#### Scenario: Main entry exports createEnv, EnvSchema, and type
- **WHEN** a user imports from `arkenv`
- **THEN** `createEnv`, `EnvSchema`, and `type` MUST be available as named exports
- **AND** ArkType MUST be a required peer dependency for this import to succeed

#### Scenario: Standard entry exports createEnv without requiring ArkType
- **WHEN** a user imports from `arkenv/standard`
- **THEN** `createEnv` MUST be available as a named export
- **AND** ArkType MUST NOT be required — the import MUST succeed even when ArkType is not installed

#### Scenario: Core entry exports ArkEnvError without requiring ArkType
- **WHEN** a user imports from `arkenv/core`
- **THEN** `ArkEnvError` MUST be available as a named export
- **AND** ArkType MUST NOT be required — the import MUST succeed even when ArkType is not installed

### Requirement: Disjoint Module Graphs for standard and core
The `arkenv/standard` and `arkenv/core` entries MUST have module graphs that contain no runtime imports of ArkType, directly or transitively.

#### Scenario: Standard entry bundle contains no ArkType runtime code
- **WHEN** `arkenv/standard` is bundled with ArkType listed as external
- **THEN** the resulting bundle MUST NOT contain any reference to the `arktype` module at runtime

#### Scenario: Core entry bundle contains no ArkType runtime code
- **WHEN** `arkenv/core` is bundled with ArkType listed as external
- **THEN** the resulting bundle MUST NOT contain any reference to the `arktype` module at runtime

### Requirement: Removal of the arkenv/arktype sub-path
The `arkenv/arktype` sub-path MUST NOT exist as a public entry point. Its formerly public export (`type`) is now available from the main `arkenv` entry.

#### Scenario: arkenv/arktype import fails with module not found
- **WHEN** a consumer attempts to import from `arkenv/arktype`
- **THEN** the module resolution MUST fail (path is not listed in `package.json` exports)

#### Scenario: type helper available from main entry
- **WHEN** a consumer imports `{ type } from "arkenv"`
- **THEN** ArkEnv's extended ArkType scope (including `string.host`, `number.port`, etc.) MUST be available
