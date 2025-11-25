# bun-plugin Specification

## ADDED Requirements

### Requirement: Bun Plugin Environment Variable Validation and Transformation

The Bun plugin SHALL validate environment variables at build-time using ArkEnv's schema validation and statically replace `process.env.VARIABLE` access with validated, transformed values during bundling. The plugin SHALL transform values according to the schema (e.g., string to boolean, apply default values).

#### Scenario: Plugin validates and transforms environment variables
- **WHEN** a user configures the Bun plugin with a schema containing environment variables
- **AND** the schema includes variables with various types (e.g., `BUN_PUBLIC_API_URL: "string"`, `BUN_PUBLIC_DEBUG: "boolean"`)
- **THEN** the plugin validates all variables in the schema at build-time
- **AND** the plugin transforms values according to the schema (e.g., `"true"` string to `true` boolean)
- **AND** the plugin statically replaces `process.env.VARIABLE` with the validated, transformed value
- **AND** default values are applied when variables are missing

#### Scenario: Plugin handles various process.env access patterns
- **WHEN** a user accesses environment variables via different patterns (e.g., `process.env.VAR`, `process.env["VAR"]`, destructuring)
- **AND** the plugin is configured with a schema
- **THEN** the plugin transforms all access patterns to use validated values
- **AND** the transformed code uses the validated, transformed values instead of raw `process.env` access

### Requirement: Bun Plugin Environment Variable Filtering

The Bun plugin SHALL automatically filter environment variables to only expose those matching Bun's configured prefix (defaults to `BUN_PUBLIC_*`) to client code. Server-only environment variables without the prefix SHALL NOT be exposed to the client bundle.

#### Scenario: Only prefixed variables are exposed to client
- **WHEN** a user passes a schema containing both prefixed (`BUN_PUBLIC_*`) and unprefixed variables to the Bun plugin
- **AND** the schema includes server-only variables like `PORT` and client-safe variables like `BUN_PUBLIC_API_URL`
- **THEN** only variables starting with the Bun prefix are validated and exposed to client code via `process.env.*`
- **AND** server-only variables are not included in the client bundle
- **AND** the plugin respects Bun's prefix configuration (from bunfig.toml or defaults to `BUN_PUBLIC_*`)

#### Scenario: Default prefix behavior
- **WHEN** a user does not configure a prefix in bunfig.toml
- **AND** they pass a schema to the Bun plugin
- **THEN** the plugin defaults to `"BUN_PUBLIC_"` as the prefix
- **AND** only variables starting with `BUN_PUBLIC_` are exposed to client code

### Requirement: Bun Plugin Type Augmentation

The Bun plugin SHALL provide TypeScript type augmentation for `process.env` similar to the Vite plugin's `ImportMetaEnvAugmented`, enabling type-safe access to environment variables in client code.

#### Scenario: Type augmentation enables type-safe access
- **WHEN** a user configures the Bun plugin with a schema
- **AND** they augment `process.env` types using `ProcessEnvAugmented<TSchema>`
- **THEN** TypeScript provides type checking and autocomplete for environment variables
- **AND** only variables matching the configured prefix are included in the type
- **AND** types reflect the validated, transformed values (e.g., `boolean` instead of `string`)

#### Scenario: Type augmentation filters by prefix
- **WHEN** a user defines a schema with both prefixed and unprefixed variables
- **AND** they use `ProcessEnvAugmented<TSchema>` for type augmentation
- **THEN** the type only includes variables matching the configured prefix
- **AND** server-only variables are excluded from the type

### Requirement: Bun Plugin Integration with Bun's Serve Function

The Bun plugin SHALL work correctly with Bun's `serve` function for full-stack React applications, validating and transforming environment variables during the bundling phase before the server starts.

#### Scenario: Plugin works with Bun serve in full-stack React app
- **WHEN** a user uses Bun's `serve` function with a full-stack React application
- **AND** they configure the Bun plugin with a schema
- **THEN** the plugin validates environment variables during bundling
- **AND** the plugin transforms `process.env` access in both server and client code
- **AND** only prefixed variables are exposed to client code
- **AND** the server starts successfully with validated environment variables

