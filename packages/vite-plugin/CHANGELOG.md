# @arkenv/vite-plugin

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
