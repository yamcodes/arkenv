## Context

The Vite plugin currently exposes all environment variables from the schema to client code, including server-only variables. This is a security vulnerability because sensitive server-side configuration can leak into the client bundle.

Vite has a built-in convention where only environment variables prefixed with `VITE_` (or a custom prefix configured via `envPrefix`) are exposed to client code. The plugin should respect this convention and filter variables accordingly.

## Goals / Non-Goals

### Goals
- Automatically filter environment variables to only expose those with the Vite prefix
- Respect Vite's `envPrefix` configuration option (defaults to `VITE_`)
- Prevent server-only variables from leaking to client code
- Maintain backward compatibility (no breaking changes)
- Make the plugin safer by default

### Non-Goals
- Requiring users to split schemas manually (the plugin should handle filtering automatically)
- Changing the plugin API or signature
- Supporting custom filtering logic beyond the Vite prefix convention

## Decisions

### Decision: Filter in the Plugin (Method 2)

**What**: Modify `arkenvVitePlugin` to automatically filter to only `VITE_*` prefixed keys (or the configured prefix).

**Why**: 
- Simplest solution that makes the plugin safer by default
- Aligns with Vite's built-in convention
- No breaking changes - users can still pass the full schema
- Prevents accidental exposure of server-only variables
- Matches the approach requested in issue #385

**Alternatives considered**:
1. **Split the schema (Option 1)** - Requires users to manually maintain two schemas, more error-prone
2. **Update example only (Option 3)** - Doesn't fix the underlying plugin behavior, still allows security issues

### Decision: Access Vite Prefix from Config

**What**: The plugin will access Vite's `envPrefix` configuration from the config object passed to the `config` hook. If not specified, it defaults to `"VITE_"`.

**Why**:
- Vite allows custom prefixes via `envPrefix` option
- The plugin should respect user configuration
- Defaults to `"VITE_"` which is Vite's standard convention

**Implementation approach**:
- In the `config` hook, read `config.envPrefix` (or default to `"VITE_"`)
- Validate all variables in the schema using `createEnv`
- Filter the validated results to only include those matching the prefix
- Expose only the filtered subset to client code

### Decision: Validate All, Then Filter Results

**What**: Validate all environment variables in the schema using `createEnv`, then filter the validated results to only include those matching the Vite prefix.

**Why**:
- **Schema type compatibility**: Works seamlessly with both raw schema objects `{ PORT: "number.port" }` and `type()` definitions without requiring schema manipulation
- **Security**: Validates all variables, catching missing or invalid server-only variables early, even if they won't be exposed to the client
- **Consistency**: Uses the same schema for both server-side and client-side validation, ensuring consistent validation rules
- **Simplicity**: No complex schema manipulation needed - just filter the validated results
- **Better error messages**: Validation errors reference actual variable names from the original schema
- **Performance**: Overhead is minimal for typical schemas (most schemas have < 20 variables)

**Alternative considered**:
- **Filter schema, then validate**: Would require complex schema manipulation to handle both raw schemas and `type()` definitions, potentially losing type information. Also provides less validation coverage since server-only variables wouldn't be validated in the plugin context. The complexity and type safety concerns outweigh the minor performance benefit.

## Risks / Trade-offs

- **Risk**: Users who were accidentally relying on server-only variables being exposed will see them removed
  - **Mitigation**: This is a security fix, not a feature. Users should not have been exposing server-only variables anyway. The fix prevents security vulnerabilities.

- **Risk**: If a user has a schema with both server and client variables, they need to ensure server variables don't start with the prefix
  - **Mitigation**: This is expected behavior - Vite's convention is that prefixed variables are client-safe. Server variables should not use the prefix.

## Migration Plan

No migration needed - this is a security fix that makes the plugin safer by default. Users who were accidentally exposing server-only variables will see them removed, which is the correct behavior.

## Open Questions

None - the approach is straightforward and aligns with Vite's conventions.

