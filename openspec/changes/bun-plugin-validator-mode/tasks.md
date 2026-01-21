# Tasks: Bun Plugin Validator Mode Support

- [x] **Core Implementation**
    - [x] Update `@arkenv/bun-plugin` signature to `arkenv(schema, config?)`.
    - [x] Update `processEnvSchema` to accept and pass `config` to `createEnv`.
- [x] **Documentation**
    - [x] Add JSDoc examples showing `validator: "standard"` usage.
    - [x] Update plugin documentation with Standard Schema examples.
- [x] **Verification**
    - [x] Add test case for `validator: "standard"` in Bun plugin tests.
    - [x] Verify using a Zod schema in an example project with `arktype` uninstalled.
