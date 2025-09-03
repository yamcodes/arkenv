# ArkEnv

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
