## ADDED Requirements

### Requirement: Vite Plugin Environment Variable Filtering

The Vite plugin SHALL automatically filter environment variables to only expose those matching Vite's configured prefix (defaults to `VITE_`) to client code. Server-only environment variables without the prefix SHALL NOT be exposed to the client bundle.

#### Scenario: Only prefixed variables are exposed to client
- **WHEN** a user passes a schema containing both prefixed (`VITE_*`) and unprefixed variables to the Vite plugin
- **AND** the schema includes server-only variables like `PORT` and client-safe variables like `VITE_API_URL`
- **THEN** only variables starting with the Vite prefix are validated and exposed to client code via `import.meta.env.*`
- **AND** server-only variables are not included in the client bundle
- **AND** the plugin respects Vite's `envPrefix` configuration option

#### Scenario: Custom prefix is respected
- **WHEN** a user configures a custom `envPrefix` in their Vite config (e.g., `envPrefix: "PUBLIC_"`)
- **AND** they pass a schema with variables using both the custom prefix and other prefixes
- **THEN** only variables starting with the custom prefix are exposed to client code
- **AND** variables with other prefixes or no prefix are not exposed

#### Scenario: Default prefix behavior
- **WHEN** a user does not configure `envPrefix` in their Vite config
- **AND** they pass a schema to the Vite plugin
- **THEN** the plugin defaults to `"VITE_"` as the prefix
- **AND** only variables starting with `VITE_` are exposed to client code

### Requirement: Vite Plugin Environment Variable Validation and Exposure

The Vite plugin SHALL validate environment variables at build-time and expose them to client code through Vite's `define` option. The plugin SHALL only expose environment variables that match Vite's configured prefix (defaults to `VITE_`), filtering out server-only variables automatically.

#### Scenario: Plugin validates and exposes client-safe variables
- **WHEN** a user configures the Vite plugin with a schema containing environment variables
- **AND** the schema includes variables with the Vite prefix (e.g., `VITE_API_URL`, `VITE_DEBUG`)
- **THEN** the plugin validates all variables in the schema at build-time
- **AND** the plugin filters the validated results to only include variables matching the configured prefix
- **AND** filtered variables are exposed to client code via `import.meta.env.*`
- **AND** server-only variables without the prefix are filtered out and not exposed

#### Scenario: Plugin respects Vite prefix configuration
- **WHEN** a user configures `envPrefix` in their Vite config
- **AND** they pass a schema to the Vite plugin
- **THEN** the plugin uses the configured prefix to filter variables after validation
- **AND** only variables matching the configured prefix are validated and exposed
- **AND** the filtering happens automatically without requiring schema changes

