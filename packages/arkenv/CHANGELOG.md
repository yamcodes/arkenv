# ArkEnv

## 0.5.0

### Minor Changes

- #### Export `createEnv` as the default export _[`#136`](https://github.com/yamcodes/arkenv/pull/136) [`2b06c4c`](https://github.com/yamcodes/arkenv/commit/2b06c4c09f3be7192dbd0e23a1bc78506a4d7293) [@yamcodes](https://github.com/yamcodes)_

  You can now import `createEnv` as the default export:

  ```ts
  import arkenv from "arkenv";
  ```

  This enables syntax highlighting along with the [ArkType VS Code extension](https://marketplace.visualstudio.com/items?itemName=arktypeio.arkdark):

  ![ArkType syntax highlighting in VS Code](https://raw.githubusercontent.com/yamcodes/arkenv/main/assets/dx.png)

  Note that named imports still work:

  ```ts
  import { createEnv } from "arkenv";
  ```

  **BREAKING CHANGE:** The default export now directly exports `createEnv` instead of an object containing all exports. If you previously used:

  ```ts
  import arkenv from "arkenv";
  const env = arkenv.createEnv({ ... });
  ```

  Update to:

  ```ts
  import arkenv from "arkenv";
  const env = arkenv({ ... });
  ```

## 0.4.0

### Minor Changes

- ## Improved type inference and scope-based validation _[`#129`](https://github.com/yamcodes/arkenv/pull/129) [`dd15b60`](https://github.com/yamcodes/arkenv/commit/dd15b608281b04eaac1bf93d3911a234e7e7565d) [@yamcodes](https://github.com/yamcodes)_

  The `createEnv` function got a facelift with better TypeScript inference and introduced a new scope-based validation system.

  **Key improvements:**

  - **Better ecosystem integration**: Use `string.host` and `number.port` in your schemas, as if they were native ArkType keywords
  - **Cleaner API**: No need to awkwardly import `host` and `port` types anymore

  ### Before:

  `host` and `port` had to be manually imported from the `arkenv` package, and used as arguments to the `createEnv` function.

  ```ts
  import { createEnv, host, port } from "arkenv";

  const env = createEnv({
    HOST: host, // Validates IP addresses or "localhost"
    PORT: port, // Validates port numbers (0-65535)
    NODE_ENV: "string", // Standard string validation
  });
  ```

  ### After:

  Now you can use `string.host` and `number.port` in your schemas, in a way that is much more natural and idiomatic within the ArkType ecosystem.

  ```ts
  import { createEnv } from "arkenv";

  const env = createEnv({
    HOST: "string.host", // Validates IP addresses or "localhost"
    PORT: "number.port", // Validates port numbers (0-65535)
    NODE_ENV: "string", // Standard string validation
  });
  ```

  ### BREAKING CHANGE:

  - We are no longer exporting `host` and `port` types. Use `string.host` and `number.port` instead.

## 0.3.0

### Minor Changes

- Rename `defineEnv` to `createEnv` _[`d46b233`](https://github.com/yamcodes/arkenv/commit/d46b23355546fd0531123cfaaffab95f74a472da) [@yamcodes](https://github.com/yamcodes)_

  The main API for building a validated env object is now `createEnv`.

  **Before**

  ```ts
  import { defineEnv } from "arkenv";

  const env = defineEnv({
    NODE_ENV: "'development' | 'production' | 'test'",
  });
  ```

  **After**

  ```ts
  import { createEnv } from "arkenv";

  const env = createEnv({
    NODE_ENV: "'development' | 'production' | 'test'",
  });
  ```

  This aligns better with the actual behavior: ArkEnv creates, validates, and returns a typesafe env object.

  BREAKING CHANGE: `defineEnv` has been removed in favor of `createEnv`.

## 0.2.0

### Minor Changes

- Rename from `ark.env` to `arkenv` _[`#102`](https://github.com/yamcodes/arkenv/pull/102) [`dfdc17f`](https://github.com/yamcodes/arkenv/commit/dfdc17f3510a9c07586201ecaf310cba3b22d67f) [@yamcodes](https://github.com/yamcodes)_

  BREAKING CHANGE:

  Package renamed from `ark.env` to `arkenv`, main export renamed from `env` to `defineEnv`.

  Before:

  ```ts
  import ark, { host, port } from "ark.env";
  const env = ark.env({
    HOST: host,
    PORT: port,
  });
  ```

  After:

  ```ts
  import { defineEnv, host, port } from "arkenv";
  const env = defineEnv({
    HOST: host,
    PORT: port,
  });
  ```

## 0.1.5

### Patch Changes

- Switch from picocolors to Chalk _[`f7c6501`](https://github.com/yamcodes/arkenv/commit/f7c6501272064d13a6f048d68ba826d58eb2eee7) [@yamcodes](https://github.com/yamcodes)_

  Switch the CLI coloring tool from [picocolors](https://github.com/alexeyraspopov/picocolors) to [Chalk](https://github.com/chalk/chalk). Chalk is a much more popular library that is already included in our lockfile, and is more modern [by being ESM](https://github.com/chalk/chalk#install).

## 0.1.4

### Patch Changes

- Fix badges in README _[`9e07e48`](https://github.com/yamcodes/arkenv/commit/9e07e4872ece404fe2075af55c4d14dd1944bd93) [@yamcodes](https://github.com/yamcodes)_

## 0.1.3

### Patch Changes

- Fix Node 18 build issue _[`97424ef`](https://github.com/yamcodes/arkenv/commit/97424ef331d6ce1a9f26c9b50c5cc43d7d0547bb) [@yamcodes](https://github.com/yamcodes)_

  Fix picocolors imports causing arkenv to not work in Node 18

## 0.1.2

### Patch Changes

- Fix npm README _[`cddd970`](https://github.com/yamcodes/arkenv/commit/cddd970e9d8f0213ece7b8b8cb3d6cf47fbbeecd) [@yamcodes](https://github.com/yamcodes)_

  This is just a documentation fix to display the correct README.md file in the npm registry.

## 0.1.1

### Patch Changes

- Fix build exports _[`05f60dd`](https://github.com/yamcodes/arkenv/commit/05f60ddb4f2869f2a6a771dd6aa4b79d4b4cb738) [@yamcodes](https://github.com/yamcodes)_

  Fix the built package by modifying the exports to the correct path.

## 0.1.0

### Minor Changes

- Rename main function to `env` and use support a default export _[`ba5bee4`](https://github.com/yamcodes/arkenv/commit/ba5bee435154b183e0973ec1e17e5739473af866) [@yamcodes](https://github.com/yamcodes)_

  This change allows importing and using the library in the following way:

  ```ts
  import ark from "arkenv";

  const env = arkenv({
    HOST: host,
    PORT: port,
  });
  ```

  You can also import the `env` function (and any other exports) directly:

  ```ts
  import { env } from "arkenv";
  ```

## 0.0.5

### Patch Changes

- Throw custom ArkEnvError _[`f6e4856`](https://github.com/yamcodes/arkenv/commit/f6e485620aa7f27d6674e1828afd61be023cea99) [@yamcodes](https://github.com/yamcodes)_

  Improve error handling by throwing ArkEnvError when environment validation fails

## 0.0.4

### Patch Changes

- Fix `port` type _[`6be6305`](https://github.com/yamcodes/arkenv/commit/6be630501af6b69bfaebd438814dfe5ab4dcacd3) [@yamcodes](https://github.com/yamcodes)_

  Fix the `port` type to be a `number`.

- Better error handling _[`80052dd`](https://github.com/yamcodes/arkenv/commit/80052dd9ba5e46ac8233d37cb47d40b5177b521f) [@yamcodes](https://github.com/yamcodes)_

  Error handling has been overhauled. Now, errors are thrown (instead of crashing the process) when the environment variables are invalid. The errors are formatted with colors and indentation for better readability.

## 0.0.3

### Patch Changes

- Support custom user environments _[`dfa942b`](https://github.com/yamcodes/arkenv/commit/dfa942b7eaa9f49dae2a968c4cb24f6c90bfa3f4) [@yamcodes](https://github.com/yamcodes)_

  We've added a new optional parameter to `env` to allow for custom environment variables. This can be used for example in Vite apps by passing `import.meta.env` as the second parameter.

## 0.0.2

### Patch Changes

- Add `host` and `port` utility types _[`e41bf8e`](https://github.com/yamcodes/arkenv/commit/e41bf8ee3d95c9c96105d53aa19d7b77c3e4dd28) [@yamcodes](https://github.com/yamcodes)_

  We're adding utility types with this feature, the first are `host` and `port`.

  `host`: An IP address or `localhost`

  `port`: A `string` that can be parsed into a `number` between 0 and 65535

- TypeScript inference _[`f9297e0`](https://github.com/yamcodes/arkenv/commit/f9297e05438f2a43c0a5855567b5fbf3d529cfd6) [@yamcodes](https://github.com/yamcodes)_

  ** ArkEnv now supports TypeScript inference** - check out this quick example:

  ```ts
  const { HOST } = env({
    HOST: "string.ip",
  });
  console.log(HOST); // <-- the type is "string"!
  ```

  The above program will error out if the environment variable is set to anything other than a valid IP address.

## 0.0.1

### Patch Changes

- 207971d: Basic env validation

  This release brings the ability to validate environment variables against a schema.
