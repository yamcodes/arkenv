# Tasks: Vite Plugin Validator Mode Support

- [x] **Core Implementation**
    - [x] Update `@arkenv/vite-plugin` signature to `arkenv(schema, config?)`.
    - [x] Pass `config` to `createEnv` in `packages/vite-plugin/src/index.ts`.
- [x] **Type Support**
    - [x] Update `InferType` in `@repo/types` to support Standard Schema 1.0.
    - [x] Update `EnvSchema` to allow Standard Schema validators without crashing when ArkType is missing.
- [x] **Verification**
    - [x] Add a test case for `validator: "standard"` in Vite plugin tests.
    - [x] Verify using a Zod schema in an example project with `arktype` uninstalled.
