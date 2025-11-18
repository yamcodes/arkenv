## ADDED Requirements

### Requirement: ArkEnv in Vite Config Files

Users SHALL be able to use ArkEnv directly in `vite.config.ts` files to validate non-prefixed environment variables (e.g., `PORT`, database credentials) that are used in the Vite configuration itself, distinct from `VITE_`-prefixed variables exposed to client code.

#### Scenario: Validate server port in vite.config.ts using loadEnv
- **WHEN** a user imports `arkenv` or `createEnv` and Vite's `loadEnv` in their `vite.config.ts`
- **AND** they use `loadEnv` to load environment variables and pass them to ArkEnv for validation
- **AND** they define a schema for unprefixed environment variables needed by the config (e.g., `PORT`, `DATABASE_URL`)
- **THEN** the environment variables are validated at build-time
- **AND** invalid or missing variables cause the build to fail with clear error messages
- **AND** the validated variables are type-safe and can be used in the Vite config

#### Scenario: Type-safe Vite config with environment variables
- **WHEN** a user uses ArkEnv to validate environment variables in vite.config.ts
- **THEN** TypeScript provides full type inference for the validated variables
- **AND** the variables can be used directly in Vite config options (server.port, build settings, etc.)
- **AND** autocomplete and type checking work correctly

#### Scenario: Error handling for invalid config variables
- **WHEN** a required environment variable for Vite config is missing or invalid
- **THEN** an `ArkEnvError` is thrown with clear error messages
- **AND** the Vite dev server or build process fails immediately
- **AND** the error message indicates which variable failed and what was expected

### Requirement: Schema and Typing Availability

The solution SHALL address the challenge of making the schema and typing available in both:
1. The `plugins` section of `defineConfig` (for the `@arkenv/vite-plugin`)
2. Around the `loadEnv` call (for validating unprefixed config variables)

#### Scenario: Schema available in both plugin and loadEnv
- **WHEN** a user wants to use ArkEnv for both config variables and client variables
- **THEN** the schema can be defined once and used in both places
- **AND** TypeScript types are available in both contexts
- **AND** the solution avoids code duplication and maintains type safety

### Requirement: loadEnv Wrapper Utility

The project SHALL optionally provide a utility that wraps Vite's `loadEnv` function with ArkEnv validation and typing, making it easier to use ArkEnv in vite.config.ts files. The utility SHALL address the schema/typing availability challenge.

#### Scenario: Using loadEnv wrapper in vite.config.ts
- **WHEN** a utility is provided that wraps Vite's `loadEnv` with ArkEnv
- **THEN** users can call the wrapper with a schema and mode
- **AND** the wrapper returns validated, type-safe environment variables
- **AND** the wrapper handles loading env vars from `.env` files based on Vite's mode
- **AND** the schema can be shared with the plugin for validating `VITE_*` variables

### Requirement: Type Safety Constraint

The environment object returned from `loadEnv` or any wrapper SHALL be type-safe. Unsafe patterns that bypass validation or type checking are FORBIDDEN.

#### Constraint: Environment object must be wrapped or typed
- **FORBIDDEN**: Directly using `loadEnv()` result without validation or proper typing
- **REQUIRED**: The environment object MUST be either:
  - Wrapped in a function (preferably) like `arkenv()`, `createEnv()`, or a new wrapper function if necessary
  - OR (less preferably) typed using TypeScript's `satisfies` operator with a proper type

#### Scenario: Unsafe usage is prevented
- **WHEN** a user attempts to use `loadEnv()` directly without validation
- **THEN** the pattern is documented as forbidden
- **AND** examples demonstrate only type-safe patterns
- **AND** documentation clearly explains why unsafe patterns are not allowed

### Requirement: Documentation for Vite Config Usage

The project SHALL provide clear documentation and examples for using ArkEnv in vite.config.ts files, clearly distinguishing between server-only (config) and client-exposed (`VITE_*`) environment variable usage patterns. Documentation SHALL explicitly forbid unsafe usage patterns.

#### Scenario: User finds documentation
- **WHEN** a user wants to validate unprefixed environment variables in their vite.config.ts
- **THEN** they can find documentation explaining how to use ArkEnv with `loadEnv` in config files
- **AND** examples are provided showing common use cases (server config, build settings, etc.)
- **AND** the documentation clearly distinguishes config env vars (unprefixed) from client env vars (`VITE_*`)
- **AND** best practices are documented

#### Scenario: Example demonstrates usage
- **WHEN** a user looks at the vite playground example
- **THEN** they see an example of using ArkEnv with `loadEnv` in vite.config.ts
- **AND** the example demonstrates validating unprefixed variables for config use
- **AND** the example is clear and follows best practices
- **AND** the example demonstrates both validation and type safety

