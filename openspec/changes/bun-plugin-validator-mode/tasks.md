# Tasks: Bun Plugin Validator Mode Support

- [ ] **Core Implementation**
    - [ ] Update `@arkenv/bun-plugin` signature to `arkenv(schema, config?)`.
    - [ ] Update `processEnvSchema` to accept and pass `config` to `createEnv`.
- [ ] **Documentation**
    - [ ] Add JSDoc examples showing `validator: "standard"` usage.
    - [ ] Update plugin documentation with Standard Schema examples.
- [ ] **Verification**
    - [ ] Add test case for `validator: "standard"` in Bun plugin tests.
    - [ ] Verify using a Zod schema in an example project with `arktype` uninstalled.
