# @repo/scope

## 0.1.0

### Minor Changes

- #### Align scope with central coercion _[`#569`](https://github.com/yamcodes/arkenv/pull/569) [`adaada4`](https://github.com/yamcodes/arkenv/commit/adaada4d214c152e8d23c983aea1747d81a0e539) [@yamcodes](https://github.com/yamcodes)_

  - **BREAKING**: Removed the custom `boolean` keyword from the root scope. ArkEnv now uses the standard ArkType `boolean` primitive combined with global coercion.
  - Updated `number.port` to use the new strict numeric refinement, as string parsing is now handled by global coercion.

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`adaada4`](https://github.com/yamcodes/arkenv/commit/adaada4d214c152e8d23c983aea1747d81a0e539)

</small>

- `@repo/keywords@0.1.0`

</details>

## 0.0.1

### Patch Changes

- #### Export $ type _[`#531`](https://github.com/yamcodes/arkenv/pull/531) [`e91a804`](https://github.com/yamcodes/arkenv/commit/e91a804dc6ec7d4a80d9bee94e87d3892f013729) [@yamcodes](https://github.com/yamcodes)_

  Export `type $ = (typeof $)["t"]` for convenience. This type is reused a lot in the other packages.
