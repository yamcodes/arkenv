# @arkenv/bun-plugin

## 0.0.6

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`d83d746`](https://github.com/yamcodes/arkenv/commit/d83d746e5f3672b97dea1d3eff0515a04af1d0e2)

</small>

- `arkenv@0.8.1`

</details>

## 0.0.5

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`adaada4`](https://github.com/yamcodes/arkenv/commit/adaada4d214c152e8d23c983aea1747d81a0e539) [`674a2ad`](https://github.com/yamcodes/arkenv/commit/674a2adfe8ffbb9bc3235f76c5d9d00e55ee37a4)

</small>

- `arkenv@0.8.0`

</details>

## 0.0.4

### Patch Changes

- #### Internal refactoring to reduce type duplication _[`#544`](https://github.com/yamcodes/arkenv/pull/544) [`d4800f9`](https://github.com/yamcodes/arkenv/commit/d4800f97d162dbeb9030576f1e97a1f50d876bad) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  Refactor the plugins to re-use internal types like `FilterByPrefix` and `InferType`, defined in the core internal types package.

  This should have no effect for the end-user.

<details><summary>Updated 1 dependency</summary>

<small>

</small>

- `arkenv@0.7.8`

</details>

## 0.0.3

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`e91a804`](https://github.com/yamcodes/arkenv/commit/e91a804dc6ec7d4a80d9bee94e87d3892f013729)

</small>

- `arkenv@0.7.8`

</details>

## 0.0.2

### Patch Changes

- #### Fix "Type instantiation is excessively deep" error _[`1d86d18`](https://github.com/yamcodes/arkenv/commit/1d86d187b08aba7c6b83f7bdce2d47bae47c7eb9) [@yamcodes](https://github.com/yamcodes)_

  Fixed "Type instantiation is excessively deep and possibly infinite" errors when using ArkEnv with complex ArkType schemas. This was [reported](https://github.com/yamcodes/arkenv/issues/497) in the ArkEnv Vite Plugin along with [ArkType 2.1.28](https://github.com/arktypeio/arktype/blob/HEAD/ark/type/CHANGELOG.md#2128), and was fixed by an overall improvement of type stability including optimizing how generics are passed to the validation logic.

<details><summary>Updated 1 dependency</summary>

<small>

[`1d86d18`](https://github.com/yamcodes/arkenv/commit/1d86d187b08aba7c6b83f7bdce2d47bae47c7eb9)

</small>

- `arkenv@0.7.7`

</details>

## 0.0.1

### Patch Changes

- Add Bun plugin for build-time environment variable validation and type-safe access, similar to the Vite plugin. _[`#439`](https://github.com/yamcodes/arkenv/pull/439) [`61a7c52`](https://github.com/yamcodes/arkenv/commit/61a7c522abb5a7e923d7c879bff1e80e6944cff2) [@yamcodes](https://github.com/yamcodes)_

  Check out the docs: https://arkenv.js.org/docs/bun-plugin
