# @repo/keywords

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
