# ark.env

## 0.0.3

### Patch Changes

- Support custom user environments _[`dfa942b`](https://github.com/yamcodes/ark.env/commit/dfa942b7eaa9f49dae2a968c4cb24f6c90bfa3f4) [@yamcodes](https://github.com/yamcodes)_

  We've added a new optional parameter to `defineEnv` to allow for custom environment variables. This can be used for example in Vite apps by passing `import.meta.env` as the second parameter.

## 0.0.2

### Patch Changes

- Add `host` and `port` utility types _[`e41bf8e`](https://github.com/yamcodes/ark.env/commit/e41bf8ee3d95c9c96105d53aa19d7b77c3e4dd28) [@yamcodes](https://github.com/yamcodes)_

  We're adding utility types with this feature, the first are `host` and `port`.

  `host`: An IP address or `localhost`

  `port`: A `string` that can be parsed into a `number` between 0 and 65535

- TypeScript inference _[`f9297e0`](https://github.com/yamcodes/ark.env/commit/f9297e05438f2a43c0a5855567b5fbf3d529cfd6) [@yamcodes](https://github.com/yamcodes)_

  ** `ark.env` now supports TypeScript inference** - check out this quick example:

  ```ts
  const { HOST } = defineEnv({
    HOST: "string.ip",
  });
  console.log(HOST); // <-- the type is "string"!
  ```

  The above program will error out if the environment variable is set to anything other than a valid IP address.

## 0.0.1

### Patch Changes

- 207971d: Basic env validation

  This release brings the ability to validate environment variables against a schema.
