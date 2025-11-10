# @arkenv/vite-plugin

## 0.0.15

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`7236cb2`](https://github.com/yamcodes/arkenv/commit/7236cb25de07f7afcc571dd3364b1507544de523) [`bf465de`](https://github.com/yamcodes/arkenv/commit/bf465dee26cd20619455bcc77f66424ca48da0fe)

</small>

- `arkenv@0.7.4`

</details>

## 0.0.14

### Patch Changes

- #### Support array defaults using `type().default()` syntax _[`#224`](https://github.com/yamcodes/arkenv/pull/224) [`ecf9b64`](https://github.com/yamcodes/arkenv/commit/ecf9b64a680d3af5c5786b288fda35608590f7a9) [@yamcodes](https://github.com/yamcodes)_

  Fix to an issue where `type("array[]").default(() => [...])` syntax was not accepted by the plugin due to overly restrictive type constraints. The plugin now accepts any string-keyed record while still maintaining type safety through ArkType's validation system.

  ##### New Features

  - Array defaults to empty using `type("string[]").default(() => [])` syntax
  - Support for complex array types with defaults
  - Mixed schemas combining string-based and type-based defaults

  ##### Example

  ```typescript
  // vite.config.ts
  import arkenv from "@arkenv/vite-plugin";
  import { type } from "arkenv";

  export default defineConfig({
    plugins: [
      arkenv({
        ALLOWED_ORIGINS: type("string[]").default(() => ["localhost"]),
        FEATURE_FLAGS: type("string[]").default(() => []),
        PORT: "number.port",
      }),
    ],
  });
  ```

  > [!NOTE]
  > This is the same fix as in [`arkenv@0.7.2` (the core library)](https://github.com/yamcodes/arkenv/releases/tag/arkenv%400.7.2), but for the Vite plugin.

- #### Fix `import.meta.env` not respecting morphed environment variables _[`#227`](https://github.com/yamcodes/arkenv/pull/227) [`d41878f`](https://github.com/yamcodes/arkenv/commit/d41878fe9cc2524f06ac2f0ef35f2f5ba58ee06b) [@yamcodes](https://github.com/yamcodes)_

  The Vite plugin now properly exposes transformed environment variables through `import.meta.env`.

  Previously, type transformations (`string → number`, `string → boolean`) and default values were lost because the plugin only called `createEnv()` without integrating the results with Vite's environment system.

  Now the plugin uses Vite's `define` option to expose the morphed values, ensuring all schema transformations are respected.

## 0.0.13

### Patch Changes

- #### Support Vite 2.x _[`#212`](https://github.com/yamcodes/arkenv/pull/212) [`bfe08f6`](https://github.com/yamcodes/arkenv/commit/bfe08f6d9f21352186420f0f68611840e164da52) [@yamcodes](https://github.com/yamcodes)_

  Extended the supported Vite versions to include **2.9.18** through **7.x** (inclusive).

  Also, we've added the `vite-plugin` keyword to the `package.json`, and a section in the `README.md` explaining why this plugin is a Vite only plugin (and not a Rollup plugin).

<details><summary>Updated 1 dependency</summary>

<small>

[`e554e2b`](https://github.com/yamcodes/arkenv/commit/e554e2b41aab1b8e29d873982ea587c069f4732d)

</small>

- `arkenv@0.7.3`

</details>

## 0.0.12

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`e50dba1`](https://github.com/yamcodes/arkenv/commit/e50dba1f19418f8fc007dc786df1172067e3d07c)

</small>

- `arkenv@0.7.2`

</details>

## 0.0.11

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`221f9ef`](https://github.com/yamcodes/arkenv/commit/221f9efdef65691b0c5155b12ec460404dddbe82) [`221f9ef`](https://github.com/yamcodes/arkenv/commit/221f9efdef65691b0c5155b12ec460404dddbe82)

</small>

- `arkenv@0.7.1`

</details>

## 0.0.10

### Patch Changes

- #### Fix types _[`#149`](https://github.com/yamcodes/arkenv/pull/149) [`02698db`](https://github.com/yamcodes/arkenv/commit/02698db49d383c77e7356419e62e66b54c237b7e) [@yamcodes](https://github.com/yamcodes)_

  Fix types in the vite plugin to correctly include all ArkType keywords as well as custom ArkEnv keywords like `string.host` and `number.port`.

- #### Fix default export autocomplete for better developer experience _[`#149`](https://github.com/yamcodes/arkenv/pull/149) [`02698db`](https://github.com/yamcodes/arkenv/commit/02698db49d383c77e7356419e62e66b54c237b7e) [@yamcodes](https://github.com/yamcodes)_

  The default export now properly aliases as `arkenv` instead of being anonymous, providing better autocomplete when importing.

  For example, in VS Code (and other IDEs that support autocomplete), when writing the following code:

  ```ts
  import { defineConfig } from "vite";

  // https://vite.dev/config/
  export default defineConfig({
    plugins: [
      arke, // Your cursor is here
    ],
  });
  ```

  Your IDE will now show completion for `arkenv`, resulting in:

  ```ts
  import arkenv from "@arkenv/vite-plugin";
  import { defineConfig } from "vite";

  // https://vite.dev/config/
  export default defineConfig({
    plugins: [
      arkenv(), // Your cursor is here
    ],
  });
  ```

  This change maintains full backward compatibility - all existing imports continue to work unchanged.

<details><summary>Updated 1 dependency</summary>

<small>

[`2ec4daa`](https://github.com/yamcodes/arkenv/commit/2ec4daae714f6fde09e75d9fae417015111ee007) [`02698db`](https://github.com/yamcodes/arkenv/commit/02698db49d383c77e7356419e62e66b54c237b7e) [`02698db`](https://github.com/yamcodes/arkenv/commit/02698db49d383c77e7356419e62e66b54c237b7e) [`e6eca4f`](https://github.com/yamcodes/arkenv/commit/e6eca4f34eeed2bc2249c3a5a2fced9880bee081)

</small>

- `arkenv@0.7.0`

</details>

## 0.0.9

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`721c014`](https://github.com/yamcodes/arkenv/commit/721c014679983d18a235cece0259fe6940269b07)

</small>

- `arkenv@0.6.0`

</details>

## 0.0.8

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`2b06c4c`](https://github.com/yamcodes/arkenv/commit/2b06c4c09f3be7192dbd0e23a1bc78506a4d7293)

</small>

- `arkenv@0.5.0`

</details>

## 0.0.7

### Patch Changes

- Upgraded ArkType peer dependency from `^2.0.0` to `^2.1.22` for compatibility with the latest version of ArkEnv _[`#129`](https://github.com/yamcodes/arkenv/pull/129) [`dd15b60`](https://github.com/yamcodes/arkenv/commit/dd15b608281b04eaac1bf93d3911a234e7e7565d) [@yamcodes](https://github.com/yamcodes)_

<details><summary>Updated 1 dependency</summary>

<small>

[`dd15b60`](https://github.com/yamcodes/arkenv/commit/dd15b608281b04eaac1bf93d3911a234e7e7565d)

</small>

- `arkenv@0.4.0`

</details>

## 0.0.6

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`d46b233`](https://github.com/yamcodes/arkenv/commit/d46b23355546fd0531123cfaaffab95f74a472da)

</small>

- `arkenv@0.3.0`

</details>

## 0.0.4

### Patch Changes

- Use new `arkenv` package _[`#102`](https://github.com/yamcodes/arkenv/pull/102) [`dfdc17f`](https://github.com/yamcodes/arkenv/commit/dfdc17f3510a9c07586201ecaf310cba3b22d67f) [@yamcodes](https://github.com/yamcodes)_

  This package has been updated to use the new `arkenv` package. No changes from your side are required.

<details><summary>Updated 1 dependency</summary>

<small>

[`dfdc17f`](https://github.com/yamcodes/arkenv/commit/dfdc17f3510a9c07586201ecaf310cba3b22d67f)

</small>

- `arkenv@0.2.0`

</details>

## 0.0.3

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`f7c6501`](https://github.com/yamcodes/arkenv/commit/f7c6501272064d13a6f048d68ba826d58eb2eee7)

</small>

- `arkenv@0.1.5`

</details>

## 0.0.2

### Patch Changes

- Support `import.meta.env` environment variables _[`f1c2a02`](https://github.com/yamcodes/arkenv/commit/f1c2a02d2c754261f5cc14f99604d267e6df86db) [@yamcodes](https://github.com/yamcodes)_

  The plugin now supports Vite [Env Variables](https://vite.dev/guide/env-and-mode) out of the box.

  This means that by providing a schema, vite will check that the environment variables are valid on build time (or dev time, if you're using `vite` or `vite dev`).

## 0.0.1

### Patch Changes

- First release _[`#68`](https://github.com/yamcodes/arkenv/pull/68) [`0a89ed4`](https://github.com/yamcodes/arkenv/commit/0a89ed4af85677fc80690a84afd0077f11bf1508) [@yamcodes](https://github.com/yamcodes)_
