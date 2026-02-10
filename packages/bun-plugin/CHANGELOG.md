# @arkenv/bun-plugin

## 0.1.2

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`1901321`](https://github.com/yamcodes/arkenv/commit/1901321cb78c26a2e8c5ebde3dccd87941ac47bf) [`1901321`](https://github.com/yamcodes/arkenv/commit/1901321cb78c26a2e8c5ebde3dccd87941ac47bf)

</small>

- `arkenv@0.9.2`

</details>

## 0.1.1

### Patch Changes

- #### Support configuration _[`#763`](https://github.com/yamcodes/arkenv/pull/763) [`06de0ef`](https://github.com/yamcodes/arkenv/commit/06de0ef3febbfc685213043ad5454f6b9e8ab564) [@yamcodes](https://github.com/yamcodes)_

  Add support for an optional configuration object as the second argument. This allows you to set the `validator` mode to `"standard"`, enabling support for libraries like Zod or Valibot without an ArkType dependency.

  ```ts
  import { z } from "zod";
  import arkenv from "@arkenv/bun-plugin";

  arkenv(
    {
      BUN_PUBLIC_API_URL: z.url(),
    },
    {
      validator: "standard",
    }
  );
  ```

<details><summary>Updated 1 dependency</summary>

<small>

[`3b747b0`](https://github.com/yamcodes/arkenv/commit/3b747b07660e035fda4a40ca90c630e283d6ba1c)

</small>

- `arkenv@0.9.1`

</details>

## 0.1.0

### Minor Changes

- #### Refactoring + remove `processEnvSchema` export _[`#739`](https://github.com/yamcodes/arkenv/pull/739) [`16c6047`](https://github.com/yamcodes/arkenv/commit/16c6047dad8d797b6e87d77ca413ba6582a16916) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  **Breaking change:** We've removed the `processEnvSchema` export from this library as it's an internal utility.

### Patch Changes

- #### Support for `.mts` and `.cts` extensions _[`#739`](https://github.com/yamcodes/arkenv/pull/739) [`16c6047`](https://github.com/yamcodes/arkenv/commit/16c6047dad8d797b6e87d77ca413ba6582a16916) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  Updated the Bun plugin to correctly process and load `.mts` and `.cts` files. This ensures environment variables are properly injected when using these TypeScript file extensions.

<details><summary>Updated 1 dependency</summary>

<small>

</small>

- `arkenv@0.9.0`

</details>

## 0.0.9

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`6bd0741`](https://github.com/yamcodes/arkenv/commit/6bd07410f97a8756366b9432be8504a8507d0876) [`926ef9b`](https://github.com/yamcodes/arkenv/commit/926ef9b5a322187feef7fce3a842b04d5ec197fa)

</small>

- `arkenv@0.9.0`

</details>

## 0.0.8

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`01c1704`](https://github.com/yamcodes/arkenv/commit/01c17041029a41f2dfcacd7dd7ed2d1cd5a8c058)

</small>

- `arkenv@0.8.3`

</details>

## 0.0.7

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`7919b6d`](https://github.com/yamcodes/arkenv/commit/7919b6dcd171553d0e6e6e819a862408284e1f71)

</small>

- `arkenv@0.8.2`

</details>

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
