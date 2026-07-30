# @arkenv/build

## 0.0.3

### Patch Changes

- #### Make missing-schema errors short and actionable across hosts _[`#1490`](https://github.com/yamcodes/arkenv/pull/1490) [`9de492a`](https://github.com/yamcodes/arkenv/commit/9de492a24ba777f766b02805fa4e2a107ca0b0c1) [@yamcodes](https://github.com/yamcodes)_

  When Bun, Next, or Nuxt cannot find an env schema, throw a consistent message that names the expected path / `schemaPath` and points to `npx @arkenv/cli@latest init`, without embedding a starter `env.ts` module.

  Example:

  ```text
  [ArkEnv] Could not find schema file at src/env.ts or env.ts. Please specify 'schemaPath' in ArkEnv options (or run `npx @arkenv/cli@latest init`).
  ```

- #### Make `env/internal/shared.ts` optional in strict layout _[`#1503`](https://github.com/yamcodes/arkenv/pull/1503) [`0b17e32`](https://github.com/yamcodes/arkenv/commit/0b17e320295606ec9c673c63cb72164de7a0e5c5) [@yamcodes](https://github.com/yamcodes)_

  Strict layout now works with just `client.ts` and `server.ts`. Omit `internal/shared.ts` when you have nothing to share — shared keys are treated as empty.

  ```ts
  // env/client.ts + env/server.ts alone is enough
  export default withArkEnv(nextConfig, {
    layout: "strict",
  });
  ```

  The CLI still scaffolds `shared.ts` by default for convenience.

## 0.0.2

### Patch Changes

- #### Add flat layout support to `@arkenv/nuxt` _[`#1248`](https://github.com/yamcodes/arkenv/pull/1248) [`be8034f`](https://github.com/yamcodes/arkenv/commit/be8034f18a8afd2ff8ee2151fac66d5f47cfe5c7) [@yamcodes](https://github.com/yamcodes)_

  Introduce flat layout schema support and typesafe `createEnv` signature overloads to `@arkenv/nuxt`.

  - Add `"flat"` layout mode to `ModuleOptions` and auto-detect it when a single `env.ts` file is configured.
  - Emit a deprecation warning in development when using the legacy `"simple"` layout option.
  - Expose flat `createEnv(schema, options)` overload with type inference for `NUXT_PUBLIC_` prefixes, `NODE_ENV`, and custom `exposeToClient` variables.

## 0.0.1

### Patch Changes

- #### Introduce Nuxt support _[`#1191`](https://github.com/yamcodes/arkenv/pull/1191) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [@yamcodes](https://github.com/yamcodes)_

  Introduce `@arkenv/nuxt` integration package providing a Nuxt module for automatic environment variable validation and runtimeConfig mapping, and add Nuxt support to the CLI scaffold wizard. The Nuxt adapter elegantly embraces Nuxt's native configuration exposure by automatically reading from `window.__NUXT__.config.public`, eliminating the need for developers to manually pass a `runtimeEnv` or `useRuntimeConfig()` map.
