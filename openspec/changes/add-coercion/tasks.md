# Tasks

- [x] 1. Update `@repo/scope` to support coercion
  - [x] 1.1 Override `number` keyword in `$` to accept `string | number` and coerce
  - [x] 1.2 Override `boolean` keyword in `$` to accept `string | boolean` and coerce
- [x] 2. Verify implicit coercion
  - [x] 2.1 Test `arkenv({ PORT: "number" })` with string input
  - [x] 2.2 Test `arkenv(type({ PORT: "number" }))` with string input
