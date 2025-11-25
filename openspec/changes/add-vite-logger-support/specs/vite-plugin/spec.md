## MODIFIED Requirements

### Requirement: Vite Plugin Environment Variable Validation and Exposure

The Vite plugin SHALL validate environment variables at build-time and expose them to client code through Vite's `define` option. The plugin SHALL only expose environment variables that match Vite's configured prefix (defaults to `VITE_`), filtering out server-only variables automatically. When validation fails, the plugin SHALL use Vite's logger to format and display error messages, following Vite's best practices for build output.

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

#### Scenario: Plugin uses Vite logger for error formatting
- **WHEN** environment variable validation fails in the Vite plugin
- **THEN** the plugin uses Vite's logger to format and display error messages
- **AND** error messages are styled using Vite's logger (which uses picocolors internally)
- **AND** the plugin displays formatted errors using Vite's logger methods (e.g., `logger.error()`)
- **AND** the build fails with a Rollup-style error using `this.error()`
- **AND** the error output integrates seamlessly with Vite's build output

#### Scenario: Plugin passes Vite logger to core library
- **WHEN** the Vite plugin needs to validate environment variables
- **THEN** it extracts Vite's logger from the resolved config
- **AND** it creates a logger adapter that converts Vite's logger API to the standard logger interface
- **AND** it passes the logger adapter to `createEnv` for error formatting
- **AND** the implementation is minimal (no custom error formatting code in the plugin)

