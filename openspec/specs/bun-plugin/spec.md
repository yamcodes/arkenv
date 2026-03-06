# bun-plugin Specification

## Purpose
Defines the ArkEnv Bun plugin: its two configuration patterns (direct instance for `Bun.build`, package reference for `Bun.serve`), build-time environment variable validation and static replacement, client-only filtering by prefix (default: `BUN_PUBLIC_`), TypeScript type augmentation via `ProcessEnvAugmented`, and support for configurable validator engines (ArkType by default, or Standard Schema).
## Requirements
### Requirement: Bun Plugin Configuration Patterns

The Bun plugin SHALL support two primary configuration patterns depending on the usage context:

1. **Direct Reference (Bun.build)**: The plugin SHALL be configurable by passing a configured plugin instance directly in the `plugins` array when using `Bun.build()`.
2. **Package Reference (Bun.serve)**: The plugin SHALL be configurable via a package name in `bunfig.toml` when using `Bun.serve()` for full-stack applications, with convention-based schema discovery.

A future, more advanced configuration pattern using a custom static file MAY be supported, but is not required for the initial version.

#### Scenario: Plugin configuration with Bun.build

- **WHEN** a user wants to build an application using `Bun.build()`
- **AND** they configure the plugin with an environment variable schema
- **THEN** they can pass a configured plugin instance directly in the `plugins` array
- **AND** the plugin validates and transforms environment variables during the build process

#### Scenario: Plugin configuration with Bun.serve via package reference

- **WHEN** a user wants to use `Bun.serve()` for a full-stack application
- **AND** they configure `bunfig.toml` with:
  - a `[serve.static]` section
  - a `plugins` array that includes the package name `@arkenv/bun-plugin`
- **AND** their project contains an ArkEnv schema file in one of the supported default locations (for example, `./src/env.arkenv.ts`, `./src/env.ts`, `./env.arkenv.ts`, `./env.ts`)
- **AND** that schema file exports a schema using `type` from arktype (via a default export or an `env` named export)
- **THEN** the plugin SHALL locate the schema file via this convention-based search
- **AND** it SHALL load the schema at startup
- **AND** it SHALL use that schema to validate and transform environment variables during the bundling phase

#### Scenario: Bun.serve configuration fails when no schema file is found

- **WHEN** a user configures `bunfig.toml` with `[serve.static].plugins = ["@arkenv/bun-plugin"]`
- **AND** there is no schema file in any of the supported default locations
- **THEN** the plugin SHALL fail fast with a clear, descriptive error message
- **AND** the error message SHALL list the paths that were checked
- **AND** the error message SHALL show an example of a minimal `env` schema file the user can create

### Requirement: Bun Plugin Environment Variable Validation and Transformation

The Bun plugin SHALL validate environment variables at build-time using ArkEnv's schema validation **with configurable validator engine** and statically replace `process.env.VARIABLE` access with validated, transformed values during bundling. The plugin SHALL transform values according to the schema (e.g., string to boolean, apply default values).

**Changes:**
- Added support for configurable validator engine via `ArkEnvConfig` parameter
- Plugin can now use either ArkType or Standard Schema validators

#### Scenario: Plugin validates with Standard Schema validators

- **WHEN** a user configures the Bun plugin with a Standard Schema (Zod/Valibot) and `validator: "standard"`
- **AND** the schema includes variables with various types
- **THEN** the plugin validates all variables using the Standard Schema validator
- **AND** the plugin transforms values according to the schema
- **AND** the plugin statically replaces `process.env.VARIABLE` with the validated value
- **AND** validation errors from the Standard Schema library are properly reported

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

### Requirement: Bun Plugin Validator Mode Configuration

The Bun plugin SHALL accept an optional `ArkEnvConfig` parameter to configure the validator engine, allowing users to choose between ArkType (default) and Standard Schema validators (e.g., Zod, Valibot).

#### Scenario: Configure plugin with Standard Schema validator

- **WHEN** a user configures the Bun plugin with a Zod schema
- **AND** they pass `{ validator: "standard" }` as the second argument
- **THEN** the plugin SHALL use Standard Schema validation instead of ArkType
- **AND** the plugin SHALL NOT require `arktype` as a dependency
- **AND** environment variables SHALL be validated using the Standard Schema validator
- **AND** the validated values SHALL be statically replaced in the bundle

```typescript
import { z } from 'zod'
import arkenv from '@arkenv/bun-plugin'

Bun.build({
  plugins: [
    arkenv({
      BUN_PUBLIC_API_URL: z.url(),
      BUN_PUBLIC_DEBUG: z.boolean()
    }, {
      validator: 'standard'
    })
  ]
})
```

#### Scenario: Default to ArkType when no validator config provided

- **WHEN** a user configures the Bun plugin without a second argument
- **THEN** the plugin SHALL default to `validator: "arktype"`
- **AND** the plugin SHALL use ArkType for validation
- **AND** existing behavior SHALL remain unchanged

#### Scenario: Validator config is passed through to createEnv

- **WHEN** a user provides an `ArkEnvConfig` object to the plugin
- **THEN** the plugin SHALL merge this config with the environment variables
- **AND** the config SHALL be passed to `createEnv` along with `env: process.env`
- **AND** all config options (validator, coerce, onUndeclaredKey, arrayFormat) SHALL be respected

