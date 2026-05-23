# @arkenv/nextjs

## 0.0.2

### Patch Changes

- #### Fix client variable type inference _[`3531758`](https://github.com/yamcodes/arkenv/commit/3531758d720c465693299bca850c7e2ce2213fcf) [@yamcodes](https://github.com/yamcodes)_

  Client environment variables now correctly infer their validated type instead of resolving to `never` for non-`NEXT_PUBLIC_` keys.

  ```ts
  const env = createEnv({
    client: {
      NEXT_PUBLIC_API_URL: "string",
    },
    runtimeEnv: {
      NEXT_PUBLIC_API_URL: "https://api.example.com",
    },
  });

  env.NEXT_PUBLIC_API_URL; // previously `never`, now `string`
  ```

## 0.0.1

### Patch Changes

- #### Initial release _[`#1067`](https://github.com/yamcodes/arkenv/pull/1067) [`a0a4cff`](https://github.com/yamcodes/arkenv/commit/a0a4cffbbbf5706bd8035d842975dde446ebb147) [@yamcodes](https://github.com/yamcodes)_
