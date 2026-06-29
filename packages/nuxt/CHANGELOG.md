# @arkenv/nuxt

## 0.0.2

### Patch Changes

- #### Add flat layout support to `@arkenv/nuxt` _[`#1248`](https://github.com/yamcodes/arkenv/pull/1248) [`be8034f`](https://github.com/yamcodes/arkenv/commit/be8034f18a8afd2ff8ee2151fac66d5f47cfe5c7) [@yamcodes](https://github.com/yamcodes)_

  Introduce flat layout schema support and typesafe `createEnv` signature overloads to `@arkenv/nuxt`.

  - Add `"flat"` layout mode to `ModuleOptions` and auto-detect it when a single `env.ts` file is configured.
  - Emit a deprecation warning in development when using the legacy `"simple"` layout option.
  - Expose flat `createEnv(schema, options)` overload with type inference for `NUXT_PUBLIC_` prefixes, `NODE_ENV`, and custom `exposeToClient` variables.

<details><summary>Updated 1 dependency</summary>

<small>

[`be8034f`](https://github.com/yamcodes/arkenv/commit/be8034f18a8afd2ff8ee2151fac66d5f47cfe5c7)

</small>

- `@arkenv/build@0.0.2`

</details>

## 0.0.1

### Patch Changes

- #### Introduce Nuxt support _[`#1191`](https://github.com/yamcodes/arkenv/pull/1191) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [@yamcodes](https://github.com/yamcodes)_

  Introduce `@arkenv/nuxt` integration package providing a Nuxt module for automatic environment variable validation and runtimeConfig mapping, and add Nuxt support to the CLI scaffold wizard. The Nuxt adapter elegantly embraces Nuxt's native configuration exposure by automatically reading from `window.__NUXT__.config.public`, eliminating the need for developers to manually pass a `runtimeEnv` or `useRuntimeConfig()` map.

<details><summary>Updated 2 dependencies</summary>

<small>

[`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0)

</small>

- `arkenv@0.12.2`
- `@arkenv/build@0.0.1`

</details>
