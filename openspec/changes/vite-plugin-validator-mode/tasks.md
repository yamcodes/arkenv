# Tasks: Vite Plugin Validator Mode Support

- [ ] **Core Implementation**
    - [ ] Update `@arkenv/vite-plugin` signature to `arkenv(schema, config?)`.
    - [ ] Pass `config` to `createEnv` in `packages/vite-plugin/src/index.ts`.
- [ ] **Type Support**
    - [ ] Update `InferType` in `@repo/types` to support Standard Schema 1.0.
    - [ ] Update `EnvSchema` to allow Standard Schema validators without crashing when ArkType is missing.
- [ ] **Verification**
    - [ ] Add a test case for `validator: "standard"` in Vite plugin tests.
    - [ ] Verify using a Zod schema in an example project with `arktype` uninstalled.
