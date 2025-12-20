# Tasks

- [ ] 1. Update `@repo/scope` to support coercion
  - [ ] 1.1 Override `number` keyword in `$` to accept `string | number` and coerce
  - [ ] 1.2 Override `boolean` keyword in `$` to accept `string | boolean` and coerce
- [ ] 2. Verify implicit coercion
  - [ ] 2.1 Test `arkenv({ PORT: "number" })` with string input
  - [ ] 2.2 Test `arkenv(type({ PORT: "number" }))` with string input
