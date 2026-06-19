# @ArkEnv/nextjs

## 1.0.0-alpha.1

### Major Changes

- #### Rename `createEnv` function to `arkenv` _[`#1203`](https://github.com/yamcodes/arkenv/pull/1203) [`235ad48`](https://github.com/yamcodes/arkenv/commit/235ad482270f2078ed7a166e863edfb6908a8adf) [@yamcodes](https://github.com/yamcodes)_

  **BREAKING CHANGE**: Rename the primary environment variable validation function from `createEnv` to `arkenv` across all packages in the ecosystem, and expose it as both the default export and a named export.

  Update all usages:

  ```ts
  // Before
  import { createEnv } from "arkenv";

  export const env = createEnv({
    NODE_ENV: "'development' | 'production' | 'test'",
  });

  // After
  import arkenv from "arkenv";
  // or: import { arkenv } from "arkenv";

  export const env = arkenv({
    NODE_ENV: "'development' | 'production' | 'test'",
  });
  ```

  Migration Steps:

  - Replace all imports and invocations of `createEnv` with `arkenv`.
  - Update config generators and plugins (Next.js config templates, Vite plugin, Bun plugin) to use `arkenv`.

## 0.1.0

### Minor Changes

- #### Enforce strict intersection typing on `runtimeEnv` and reject legacy configs _[`#1206`](https://github.com/yamcodes/arkenv/pull/1206) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [@yamcodes](https://github.com/yamcodes)_

  Restored strict intersection types (`Record<RequiredKeys, unknown> & Record<string, unknown>`) on the Next.js `createEnv` adapter to guarantee compile-time enforcement of required schema keys. Additionally, narrowed the accepted `runtimeEnv` record value type to `string | undefined` to actively reject invalid configurations.

  **BREAKING CHANGE**: If you were using the legacy Next.js `env` object configuration (e.g., passing a nested object to `runtimeEnv`), or if you were failing to explicitly map all required keys into `runtimeEnv`, your build will now fail with a TypeScript error. You must explicitly map all variables referenced in your schema as `string | undefined`.

  Usage:

  ```ts
  import { createEnv } from "@arkenv/nextjs";

  export const env = createEnv({
    client: { NEXT_PUBLIC_API: "string" },
    runtimeEnv: {
      // TypeScript will error if NEXT_PUBLIC_API is missing,
      // and will also error if you try to pass an object or array.
      NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API,
    },
  });
  ```
### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`235ad48`](https://github.com/yamcodes/arkenv/commit/235ad482270f2078ed7a166e863edfb6908a8adf)

</small>

- `arkenv@1.0.0-alpha.1`

</details>

## 1.0.0-alpha.0

### Major Changes

- #### Initialize v1.0.0-alpha pre-releases _[`#1165`](https://github.com/yamcodes/arkenv/pull/1165) [`0e86f0d`](https://github.com/yamcodes/arkenv/commit/0e86f0d511b4f9e647da0123025f45687d89a4ed) [@yamcodes](https://github.com/yamcodes)_

  Start the pre-release track for the official v1.0.0 release.

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`0e86f0d`](https://github.com/yamcodes/arkenv/commit/0e86f0d511b4f9e647da0123025f45687d89a4ed) [`b666698`](https://github.com/yamcodes/arkenv/commit/b66669888cf2f8c756cce12fd6210c492146cd87)

</small>

- `arkenv@1.0.0-alpha.0`

</details>

## 0.1.0

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1)

</small>

- `arkenv@0.12.2`

</details>

## 0.0.9

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`3bfbcb7`](https://github.com/yamcodes/arkenv/commit/3bfbcb7ee48439f0cfa71cc2f23c9555660cd905)

</small>

- `arkenv@0.12.1`

</details>

## 0.0.8

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`88b0eee`](https://github.com/yamcodes/arkenv/commit/88b0eee7a87ffaf249d69035a747f1bb55f7079b)

</small>

- `arkenv@0.12.0`

</details>

## 0.0.7

### Patch Changes

- #### Fix development watcher memory and file descriptor leak _[`#1136`](https://github.com/yamcodes/arkenv/pull/1136) [`593509a`](https://github.com/yamcodes/arkenv/commit/593509a471c51b452477b0abb92053819333e91e) [@yamcodes](https://github.com/yamcodes)_

  Store the active `chokidar` watcher instance on `globalThis.__arkenv_watcher__` and close it when configuring a new watcher instance.

- #### Remove `@deprecated` JSDoc tag from `createEnv` and `arkenv` in the main and react-server entries _[`#1139`](https://github.com/yamcodes/arkenv/pull/1139) [`fae4c1f`](https://github.com/yamcodes/arkenv/commit/fae4c1fb911a59bbb2e5d43f58961ba84c6623a8) [@yamcodes](https://github.com/yamcodes)_

  Avoid warning users when they call `createEnv` manually without using the codegen workflow.

## 0.0.6

### Patch Changes

- #### Fix env.gen import path in strict layout and export default alias _[`#1121`](https://github.com/yamcodes/arkenv/pull/1121) [`e75194e`](https://github.com/yamcodes/arkenv/commit/e75194e8883abea2ca2dd1b598b880977052d14f) [@yamcodes](https://github.com/yamcodes)_

  Correct the hardcoded import path to generated factory in Next.js 3-file strict mode client template. Also export `createEnv` as default export (aliased as `arkenv`) in the generated `env.gen.ts` file.

## 0.0.5

### Patch Changes

- #### Generate tailored `createEnv` factory in Next.js strict layout _[`#1116`](https://github.com/yamcodes/arkenv/pull/1116) [`b62ebbd`](https://github.com/yamcodes/arkenv/commit/b62ebbd316db239295884a32348d1a496e8cd49b) [@yamcodes](https://github.com/yamcodes)_

  Generate a tailored `createEnv` factory helper in `env.gen.ts` when using the strict split-schema layout (instead of exporting a raw `runtimeEnv` object).

  This eliminates the need to manually declare or reference the `runtimeEnv` object inside the client schema `client.ts` file, aligning it closer to the core `arkenv` experience of simply calling `createEnv(schema, options)`.

  Example usage in `client.ts`:

  ```ts
  import { createEnv } from "./generated/env.gen";
  import { SharedSchema } from "./internal/shared";

  export const env = createEnv(
    {
      NEXT_PUBLIC_API_URL: "string",
    },
    {
      extends: [SharedSchema],
    }
  );
  ```

- #### Support split schema layout in Next.js config wrapper _[`#1116`](https://github.com/yamcodes/arkenv/pull/1116) [`b62ebbd`](https://github.com/yamcodes/arkenv/commit/b62ebbd316db239295884a32348d1a496e8cd49b) [@yamcodes](https://github.com/yamcodes)_

  Add support for the strict split schema layout in the Next.js `withArkEnv` configuration wrapper and update CLI scaffolding instructions:

  - Add a `layout` option (`"simple" | "strict"`) to `withArkEnv` configuration, which defaults to auto-detecting the strict layout if split files (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`) exist.
  - Implement key extraction from strict client and shared schema files.
  - Update CLI next-steps messages to include `withArkEnv` wrapping instructions for strict layout nextjs projects.

## 0.0.4

### Patch Changes

- #### Implement Next.js separate files mode, shared entry point, and native extends API _[`#1084`](https://github.com/yamcodes/arkenv/pull/1084) [`d921785`](https://github.com/yamcodes/arkenv/commit/d92178567ed4cdd5227cc107bf98d148e5fae0c1) [@yamcodes](https://github.com/yamcodes)_

  Introduce dedicated entry points for `@arkenv/nextjs/server`, `@arkenv/nextjs/client`, and `@arkenv/nextjs/shared` to prevent metadata leakage and support compile-time bundler-enforced isolation. Add a native `extends` API to merge validated outputs of extended proxies while maintaining proxy-level protections.

  Also update the CLI `init` wizard to support interactive layout selection (Strict 3-file vs Simple 1-file) and `--strict` / `--simple` flags to bypass interactive selection.

  Example server usage:

  ```ts
  import { createEnv } from "@arkenv/nextjs/server";
  import { env as clientEnv } from "./env.client";

  export const env = createEnv(
    { DATABASE_URL: "string" },
    { extends: [clientEnv] }
  );
  ```

  Example client usage:

  ```ts
  import { createEnv } from "@arkenv/nextjs/client";

  export const env = createEnv(
    { NEXT_PUBLIC_API_URL: "string" },
    {
      runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      },
    }
  );
  ```

- #### Add `withArkEnv` configuration helper for Next.js _[`#1092`](https://github.com/yamcodes/arkenv/pull/1092) [`c6c30ab`](https://github.com/yamcodes/arkenv/commit/c6c30abbc1df4bb74b2ab5c6f689fcae557ffb05) [@yamcodes](https://github.com/yamcodes)_

  Add a Next.js configuration wrapper in `@arkenv/nextjs/config` that automates client-side and shared environment variable destructuring in the `runtimeEnv` block:

  ```typescript
  // next.config.ts
  import { withArkEnv } from "@arkenv/nextjs/config";
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    reactStrictMode: true,
  };

  export default withArkEnv(nextConfig);
  ```

  Key features:

  - **Zero-Boilerplate Destructuring**: Statically extract `client` and `shared` keys from your `env.ts` schema and generate a tailored `createEnv` factory in `generated/env.gen.ts` that pre-fills the `runtimeEnv` block.
  - **Development Watcher**: Automatically start a lightweight file watcher in development mode to regenerate `generated/env.gen.ts` on the fly when `env.ts` changes.
  - **Customizable Output**: Support custom schema and output paths, enabling developers to write generated files to a dedicated folder (e.g., `src/generated/env.gen.ts`).
  - **Deprecate Direct Exports**: Mark direct `createEnv` and default `arkenv` exports from the main and `react-server` entry points as deprecated to steer developers toward the new codegen workflow.

  Example usage in `env.ts`:

  ```typescript
  // env.ts
  import { createEnv } from "./generated/env.gen";

  export const env = createEnv({
    client: {
      NEXT_PUBLIC_API_URL: "string",
    },
    shared: {
      NODE_ENV: "string",
    },
  });
  ```

<details><summary>Updated 1 dependency</summary>

<small>

[`c6c30ab`](https://github.com/yamcodes/arkenv/commit/c6c30abbc1df4bb74b2ab5c6f689fcae557ffb05)

</small>

- `arkenv@0.11.1`

</details>

## 0.0.3

### Patch changes

- #### Fix Next.js schema string autocomplete _[`#1079`](https://github.com/yamcodes/arkenv/pull/1079) [`bbab725`](https://github.com/yamcodes/arkenv/commit/bbab725cc4817053fb0bfb693deaadee4a5f1519) [@pullfrog](https://github.com/apps/pullfrog)_

  Provide ArkType DSL contextual typing for `server`, `client`, and `shared` schema values.

## 0.0.2

### Patch changes

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

### Patch changes

- #### Initial release _[`#1067`](https://github.com/yamcodes/arkenv/pull/1067) [`a0a4cff`](https://github.com/yamcodes/arkenv/commit/a0a4cffbbbf5706bd8035d842975dde446ebb147) [@yamcodes](https://github.com/yamcodes)_
