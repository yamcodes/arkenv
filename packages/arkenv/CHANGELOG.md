# ArkEnv

## 0.7.5

### Patch Changes

- #### Add declaration maps for better IDE experience _[`#360`](https://github.com/yamcodes/arkenv/pull/360) [`17c970f`](https://github.com/yamcodes/arkenv/commit/17c970fb6d8ac433669e9d42c21b5ce6002066dd) [@yamcodes](https://github.com/yamcodes)_

  Enable TypeScript declaration maps so that when you use "Go to Definition" in your IDE, it navigates directly to the original source code instead of the generated type definition files. This makes it easier to explore and understand how the packages work.

## 0.7.4

### Patch Changes

- #### Enable minification to reduce bundle size _[`#336`](https://github.com/yamcodes/arkenv/pull/336) [`7236cb2`](https://github.com/yamcodes/arkenv/commit/7236cb25de07f7afcc571dd3364b1507544de523) [@yamcodes](https://github.com/yamcodes)_

  Enable minification in build output. Reduces bundle size from 711 B to 708 B. Comments are removed from the bundle but remain in source files.

- #### Fix browser compatibility by replacing `util.styleText` with cross-platform ANSI codes _[`#290`](https://github.com/yamcodes/arkenv/pull/290) [`bf465de`](https://github.com/yamcodes/arkenv/commit/bf465dee26cd20619455bcc77f66424ca48da0fe) [@yamcodes](https://github.com/yamcodes)_

  Replace Node.js `util.styleText` with cross-platform ANSI color codes to fix the "Module 'node:util' has been externalized for browser compatibility" error in browser environments. The library still maintains zero dependencies!

  **Changes:**

  - Replaced `node:util.styleText` with custom ANSI implementation
  - Added environment detection (uses ANSI in Node, plain text in browsers)
  - Respects `NO_COLOR`, `CI` environment variables, and TTY detection
  - Organized utilities into `lib/` folder with comprehensive tests

  ```ts
  // No longer throws "node:util has been externalized" error
  import { createEnv } from "arkenv";

  const env = createEnv({
    VITE_API_URL: "string",
    VITE_PORT: "number.port",
  });
  ```

## 0.7.3

### Patch Changes

- #### Automatic boolean string conversion _[`#218`](https://github.com/yamcodes/arkenv/pull/218) [`e554e2b`](https://github.com/yamcodes/arkenv/commit/e554e2b41aab1b8e29d873982ea587c069f4732d) [@yamcodes](https://github.com/yamcodes)_

  The `boolean` type now accepts `"true"`/`"false"` strings from environment variables and converts them to actual boolean values. This also works with boolean defaults.

  Example:

  ```ts
  import arkenv from "arkenv";

  const env = arkenv({
    DEBUG: "boolean",
    ENABLE_FEATURE: "boolean = true",
  });

  console.log(env.DEBUG);
  console.log(env.ENABLE_FEATURE);
  ```

  Result:

  ```sh
  ❯ DEBUG=true npx tsx index.ts
  true
  true
  ```

## 0.7.2

### Patch Changes

- #### Support array defaults using type().default() syntax _[`#199`](https://github.com/yamcodes/arkenv/pull/199) [`e50dba1`](https://github.com/yamcodes/arkenv/commit/e50dba1f19418f8fc007dc786df1172067e3d07c) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  Fix to an issue where `type("array[]").default(() => [...])` syntax was not accepted by `createEnv` due to overly restrictive type constraints. The function now accepts any string-keyed record while still maintaining type safety through ArkType's validation system.

  ##### New Features

  - Array defaults to empty using `type("string[]").default(() => [])` syntax
  - Support for complex array types with defaults
  - Mixed schemas combining string-based and type-based defaults

  ##### Example

  ```typescript
  const env = arkenv({
    ALLOWED_ORIGINS: type("string[]").default(() => ["localhost"]),
    FEATURE_FLAGS: type("string[]").default(() => []),
    PORT: "number.port",
  });
  ```

## 0.7.1

### Patch Changes

- Export `ArkEnvError` _[`#161`](https://github.com/yamcodes/arkenv/pull/161) [`221f9ef`](https://github.com/yamcodes/arkenv/commit/221f9efdef65691b0c5155b12ec460404dddbe82) [@yamcodes](https://github.com/yamcodes)_

  You can now import `ArkEnvError` from `arkenv`:

  ```ts
  import { ArkEnvError } from "arkenv";
  ```

- Improve JSDoc _[`#161`](https://github.com/yamcodes/arkenv/pull/161) [`221f9ef`](https://github.com/yamcodes/arkenv/commit/221f9efdef65691b0c5155b12ec460404dddbe82) [@yamcodes](https://github.com/yamcodes)_

  The JSDoc for `arkenv` and `createEnv` is now more descriptive.

## 0.7.0

### Minor Changes

- #### `Env` type now always uses ArkEnv scope _[`#149`](https://github.com/yamcodes/arkenv/pull/149) [`02698db`](https://github.com/yamcodes/arkenv/commit/02698db49d383c77e7356419e62e66b54c237b7e) [@yamcodes](https://github.com/yamcodes)_

  The `Env` type has been simplified and fixed to include the ArkEnv scope.

  Before:

  ```
  export type Env<def, $ = {}> = type.validate<def, $>;
  ```

  After:

  ```
  export type Env<def> = type.validate<def, (typeof $)["t"]>; // (Whereas $ is the ArkEnv scope)
  ```

  BREAKING CHANGE:

  We no longer allow specifying a custom scope in the `Env` type.

- #### `createEnv` signature simplified _[`#149`](https://github.com/yamcodes/arkenv/pull/149) [`02698db`](https://github.com/yamcodes/arkenv/commit/02698db49d383c77e7356419e62e66b54c237b7e) [@yamcodes](https://github.com/yamcodes)_

  The `createEnv` function now has a simpler signature:

  - No longer uses multiple overloads. Return type now always uses the ArkEnv scope

  BREAKING CHANGE:

  You can no longer rely on `Env` to type `createEnv` with a custom scope. Only the ArkEnv scope is supported.

### Patch Changes

- #### Fix default export autocomplete for better developer experience _[`#147`](https://github.com/yamcodes/arkenv/pull/147) [`2ec4daa`](https://github.com/yamcodes/arkenv/commit/2ec4daae714f6fde09e75d9fae417015111ee007) [@yamcodes](https://github.com/yamcodes)_

  The default export now properly aliases as `arkenv` instead of `createEnv`, providing better autocomplete when importing.

  For example, in VS Code (and other IDEs that support autocomplete), when writing the following code:

  ```ts
  // top of file

  const env = arke;
  ```

  Your IDE will now show completion for `arkenv`, resulting in:

  ```ts
  // top of file
  import arkenv from "arkenv";

  const env = arkenv();
  ```

  This change maintains full backward compatibility - all existing imports continue to work unchanged (like `import { createEnv } from "arkenv";`).

- #### Replace Chalk dependency with Node.js built-in `util.styleText` _[`e6eca4f`](https://github.com/yamcodes/arkenv/commit/e6eca4f34eeed2bc2249c3a5a2fced9880bee081) [@yamcodes](https://github.com/yamcodes)_

  Remove the external `chalk` dependency and replace it with Node.js built-in `util.styleText`, available [from Node.js v20.12.0](https://nodejs.org/api/util.html#utilstyletextformat-text-options). This makes ArkEnv zero-dependency.

## 0.6.0

### Minor Changes

- #### Expose `type` function _[`#139`](https://github.com/yamcodes/arkenv/pull/139) [`721c014`](https://github.com/yamcodes/arkenv/commit/721c014679983d18a235cece0259fe6940269b07) [@yamcodes](https://github.com/yamcodes)_

  ArkEnv now exposes a `type` function with built-in ArkEnv scope, providing access to environment-specific types like `string.host` and `number.port`.

  ```ts
  import { type } from "arkenv";

  const env = type({
    NODE_ENV: "string",
    HOST: "string.host",
    PORT: "number.port",
  });

  const result = env.assert({
    NODE_ENV: "development",
    HOST: "localhost",
    PORT: "3000",
  });
  ```

  This extends ArkType's `type` function with ArkEnv-specific validations for common environment variable patterns.

## 0.5.0

### Minor Changes

- #### Export `createEnv` as the default export _[`#136`](https://github.com/yamcodes/arkenv/pull/136) [`2b06c4c`](https://github.com/yamcodes/arkenv/commit/2b06c4c09f3be7192dbd0e23a1bc78506a4d7293) [@yamcodes](https://github.com/yamcodes)_

  You can now import `createEnv` as the default export:

  ```ts
  import arkenv from "arkenv";
  ```

  This enables syntax highlighting along with the [ArkType VS Code extension](https://marketplace.visualstudio.com/items?itemName=arktypeio.arkdark):

  ![ArkType syntax highlighting in VS Code](https://arkenv.js.org/assets/dx.png)

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
