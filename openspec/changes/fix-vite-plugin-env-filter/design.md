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
- Filter the schema keys to only include those starting with the prefix
- Only validate and expose the filtered subset to client code

### Decision: Filter Schema Before Validation

**What**: Filter the schema keys to only include those matching the prefix, then validate only those keys.

**Why**:
- More efficient - only validates what will be exposed
- Clearer intent - the schema passed to `createEnv` only contains client-safe variables
- Prevents validation errors for server-only variables that shouldn't be in the client schema

**Alternative considered**:
- Validate all, then filter results - Less efficient and could cause validation errors for server-only variables that aren't meant for client

## Risks / Trade-offs

- **Risk**: Users who were accidentally relying on server-only variables being exposed will see them removed
  - **Mitigation**: This is a security fix, not a feature. Users should not have been exposing server-only variables anyway. The fix prevents security vulnerabilities.

- **Risk**: If a user has a schema with both server and client variables, they need to ensure server variables don't start with the prefix
  - **Mitigation**: This is expected behavior - Vite's convention is that prefixed variables are client-safe. Server variables should not use the prefix.

## Migration Plan

No migration needed - this is a security fix that makes the plugin safer by default. Users who were accidentally exposing server-only variables will see them removed, which is the correct behavior.

## Open Questions

None - the approach is straightforward and aligns with Vite's conventions.

