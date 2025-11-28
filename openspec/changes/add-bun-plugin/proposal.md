<file name=spec.md path=/Users/yamcodes/code/arkenv/openspec/changes/add-bun-plugin/specs/bun-plugin>
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
</file>

<file name=design.md path=/Users/yamcodes/code/arkenv/openspec/changes/add-bun-plugin>
### Decision: Configuration Modes and Schema Discovery

**What**: The plugin supports two core configuration modes:

1. **Direct Reference (Bun.build)** – pass a configured plugin instance directly in the `plugins` array.
2. **Package Reference with Convention (Bun.serve)** – declare `@arkenv/bun-plugin` in `bunfig.toml` and let the plugin discover the ArkEnv schema file using a set of well-known paths.

A third, more advanced mode using a custom static plugin file may be added later for projects with non-standard layouts, but is not required for the initial release.

**Why**:

- `Bun.build()` accepts plugins directly as JavaScript objects, which is ideal for explicit, programmatic configuration.
- `Bun.serve()` uses `bunfig.toml` where `plugins` is a list of strings (module specifiers) and does not support passing options inline.
- By using a package name (`"@arkenv/bun-plugin"`) plus convention-based schema discovery, we avoid forcing users to create extra “config glue” files for the common case, while still keeping an escape hatch for advanced setups.

**Implementation**:

**Pattern 1: Bun.build (Direct Reference)**

```ts
// build.ts
import arkenv from "@arkenv/bun-plugin";
import { type } from "arktype";

const env = type({
  BUN_PUBLIC_API_URL: "string",
  BUN_PUBLIC_DEBUG: "boolean",
});

await Bun.build({
  entrypoints: ["./app.tsx"],
  outdir: "./dist",
  plugins: [arkenv(env)],
});
```

**Pattern 2: Bun.serve (Package Reference with Convention)**

```toml
# bunfig.toml
[serve.static]
env = "BUN_PUBLIC_*"
plugins = ["@arkenv/bun-plugin"]
```

With a schema file at a conventional path, for example:

```ts
// src/env.ts
import { type } from "arktype";

const env = type({
  BUN_PUBLIC_API_URL: "string",
  BUN_PUBLIC_DEBUG: "boolean",
});

export default env;
```

At startup, `@arkenv/bun-plugin`:

- Searches for a schema file in a small set of well-known locations (for example: `./src/env.arkenv.ts`, `./src/env.ts`, `./env.arkenv.ts`, `./env.ts`).
- Imports the first one it finds.
- Reads the default export (or an `env` named export) as the ArkEnv schema.
- Creates a Bun plugin and registers it with `Bun.plugin(...)`.

If no schema file is found, or the module does not export a usable schema, the plugin fails fast with a clear error message that lists the paths checked and shows a minimal example.

**Future / Advanced Mode (Custom Static File)**

In future iterations we MAY support a custom plugin entry file pattern for advanced layouts, for example:

```toml
[serve.static]
plugins = ["./arkenv.bun-plugin.ts"]
```

```ts
// arkenv.bun-plugin.ts
import { Bun } from "bun";
import { buildArkEnvBunPlugin } from "@arkenv/bun-plugin";

Bun.plugin(
  await buildArkEnvBunPlugin({
    schemaPath: "./config/env/app.env.ts",
    // future options (prefix overrides, strictness, etc.)
  }),
);
```

This keeps the default experience zero-config for most users, while still allowing power users to override the schema location and other options when needed.

**Alternatives considered**:

- **Static file reference as the only pattern** (previous design): Forces every project to create a separate `bun-plugin-config.ts` file even in simple setups, increasing boilerplate.
- **Schema definition via JSON/YAML or bunfig.toml**: Reduces type safety and breaks the “define once in TypeScript” story that ArkEnv aims for.
- **Only programmatic configuration** (no bunfig path): Would make full-stack `Bun.serve()` setups awkward compared to other Bun plugins that integrate via `bunfig.toml`.
</file>

<file name=proposal.md path=/Users/yamcodes/code/arkenv/openspec/changes/add-bun-plugin>
# Change: Add Bun Plugin for ArkEnv

## Why

ArkEnv currently provides a Vite plugin for build-time environment variable validation and type-safe access in client code. However, Bun users (especially those building full-stack React applications with Bun's `serve` function) need similar functionality.

Bun's bundler statically replaces `process.env` variables during build, which means:
- Environment variables must be validated and transformed at build-time
- Only variables matching Bun's prefix (defaults to `BUN_PUBLIC_*`) should be exposed to client code
- Type augmentation is needed for type-safe access to `process.env` in client code
- The plugin must work within Bun's serve function for full-stack React apps

Without a Bun plugin, users must manually validate environment variables or risk runtime errors, and they lose the type safety and build-time validation benefits that ArkEnv provides.

## What Changes

- **ADDED**: New `@arkenv/bun-plugin` package that provides Bun plugin integration
- **ADDED**: Build-time environment variable validation using Bun's plugin API
- **ADDED**: Automatic filtering of environment variables based on Bun's prefix (defaults to `BUN_PUBLIC_*`)
- **ADDED**: Static replacement of `process.env` variables with validated, transformed values during bundling
- **ADDED**: Type augmentation for `process.env` similar to Vite plugin's `ImportMetaEnvAugmented`
- **ADDED**: Support for Bun's serve function in full-stack React applications
- **ADDED**: Documentation and examples for using the Bun plugin

The plugin will work very similarly to the Vite plugin:
- Uses Bun's `onLoad` hook to intercept and transform environment variable access
- Validates environment variables using ArkEnv's schema validation
- Filters variables to only expose those matching the configured prefix
- Replaces `process.env.VARIABLE` with validated, transformed values (e.g., string to boolean, default values)
- Provides TypeScript type augmentation for type-safe access

**Usage Patterns**:
- **Bun.build**: Pass a configured plugin instance directly in the `plugins` array (standard Bun plugin API), for example `plugins: [arkenv(env)]`.
- **Bun.serve (default)**: Configure `bunfig.toml` with `[serve.static].plugins = ["@arkenv/bun-plugin"]`. The plugin discovers the ArkEnv schema file from a small set of conventional locations (for example `./src/env.arkenv.ts`, `./src/env.ts`, `./env.arkenv.ts`, `./env.ts`) and uses it automatically.
- **Bun.serve (advanced, future)**: Optionally support a custom plugin entry file referenced from `bunfig.toml` (for example `plugins = ["./arkenv.bun-plugin.ts"]`) for projects that need a non-standard schema location or additional configuration.
</file>
