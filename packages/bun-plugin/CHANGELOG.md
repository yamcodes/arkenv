# @arkenv/bun-plugin

## 0.0.2

### Patch Changes

- #### Fix "Type instantiation is excessively deep" error _[`#511`](https://github.com/yamcodes/arkenv/pull/511) [`0a44dcd`](https://github.com/yamcodes/arkenv/commit/0a44dcd6425e6da918f5ae370d966ef009c65ff9) [@yamcodes](https://github.com/yamcodes)_

  Fixed "Type instantiation is excessively deep and possibly infinite" errors when using the plugins with complex ArkType schemas. This was [reported](https://github.com/yamcodes/arkenv/issues/497) in the ArkEnv Vite Plugin along with [ArkType 2.1.28](https://github.com/arktypeio/arktype/blob/HEAD/ark/type/CHANGELOG.md#2128), and was fixed by an overall improvement of type stability including optimizing how generics are passed to the validation logic.

<details><summary>Updated 1 dependency</summary>

<small>

</small>

- `arkenv@0.7.6`

</details>

## 0.0.1

### Patch Changes

- Add Bun plugin for build-time environment variable validation and type-safe access, similar to the Vite plugin. _[`#439`](https://github.com/yamcodes/arkenv/pull/439) [`61a7c52`](https://github.com/yamcodes/arkenv/commit/61a7c522abb5a7e923d7c879bff1e80e6944cff2) [@yamcodes](https://github.com/yamcodes)_

  Check out the docs: https://arkenv.js.org/docs/bun-plugin
