# @arkenv/nuxt

## 1.0.0-alpha.1

### Major Changes

- #### Move `arkenv` to peer dependencies in framework plugins _[`#1202`](https://github.com/yamcodes/arkenv/pull/1202) [`763270c`](https://github.com/yamcodes/arkenv/commit/763270c473767c144509fb5628327635274f4611) [@yamcodes](https://github.com/yamcodes)_

  Framework plugins no longer declare `arkenv` as a regular dependency. `arkenv` is now declared as a `peerDependency` with a caret range (`^1.0.0`), ensuring a single shared instance across all plugins and the host application.

  This change prevents duplicate instances of `arkenv` in `node_modules`, which could break ArkType structural typing and schema validation at runtime.

  Plugins affected:

  - `@arkenv/nextjs`
  - `@arkenv/nuxt`
  - `@arkenv/vite-plugin`
  - `@arkenv/bun-plugin`

  Before:

  ```bash
  npm install @arkenv/nextjs
  ```

  After:

  ```bash
  npm install arkenv @arkenv/nextjs
  ```

  **BREAKING CHANGE:** Users must now install `arkenv` alongside the plugin. Previously, `arkenv` was automatically pulled in as a regular dependency.

## 0.0.2-alpha.0

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`427ced6`](https://github.com/yamcodes/arkenv/commit/427ced6bd9af4589c5fd696906bdf712104870bb)

</small>

- `arkenv@1.0.0-alpha.2`

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
