# bun-plugin Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
