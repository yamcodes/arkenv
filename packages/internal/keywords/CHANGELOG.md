# @repo/keywords

## 0.2.1

### Patch Changes

- #### Add `maybeJson` keyword _[`#694`](https://github.com/yamcodes/arkenv/pull/694) [`01c1704`](https://github.com/yamcodes/arkenv/commit/01c17041029a41f2dfcacd7dd7ed2d1cd5a8c058) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  JSDoc:

  ```ts
  /**
   * A loose JSON morph.
   *
   * **In**: `unknown`
   *
   * **Out**: A parsed JSON object if the input is a valid JSON string; otherwise the original input.
   *
   * Useful for coercion in unions where failing on non-JSON strings would block other branches.
   */
  ```

## 0.2.0

### Minor Changes

- #### Rename `maybeParsedNumber`/`maybeParsedBoolean` to `maybeNumber`/`maybeBoolean` _[`#693`](https://github.com/yamcodes/arkenv/pull/693) [`7919b6d`](https://github.com/yamcodes/arkenv/commit/7919b6dcd171553d0e6e6e819a862408284e1f71) [@yamcodes](https://github.com/yamcodes)_

  Rename these types for brevity and clarity.

## 0.1.0

### Minor Changes

- #### Simplify keywords for central coercion _[`#569`](https://github.com/yamcodes/arkenv/pull/569) [`adaada4`](https://github.com/yamcodes/arkenv/commit/adaada4d214c152e8d23c983aea1747d81a0e539) [@yamcodes](https://github.com/yamcodes)_

  - **BREAKING**: The `boolean` keyword has been removed. Universal boolean coercion is now handled by the `arkenv` package.
  - **BREAKING**: The `port` keyword has been changed from a `string -> number` morph to a pure `number` refinement. Numeric coercion is now handled centrally.
  - Added `maybeParsedNumber` and `maybeParsedBoolean` internal morphs to support central coercion (including specific "NaN" support).
