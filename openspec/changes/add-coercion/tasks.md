# Tasks

- [x] 1. Define coercion primitives in `@repo/keywords`
  - [x] 1.1 Implement `parsedNumber` (string | number => number)
  - [x] 1.2 Implement `parsedBoolean` (string | boolean => boolean)
  - [x] 1.3 Update `port` to use `parsedNumber`
- [x] 2. Clean up `@repo/scope`
  - [x] 2.1 Revert `number` and `boolean` to standard primitives to support refinements
- [x] 3. Implement Global Schema Transformer in `arkenv`
  - [x] 3.1 Create `coerce` utility using `schema.transform()`
  - [x] 3.2 Add support for numeric property values (including refined intersections)
  - [x] 3.3 Add support for boolean property values
  - [x] 3.4 Add support for root-level primitives
- [x] 4. Integrate transformer into `createEnv`
  - [x] 4.1 Apply `coerce` transformation after schema parsing
- [x] 5. Verify and Test
  - [x] 5.1 Test basic coercion
  - [x] 5.2 Test range refinements (`number >= 18`)
  - [x] 5.3 Test divisor refinements (`number % 2`)
  - [x] 5.4 Test literal unions (verified strict by default)
