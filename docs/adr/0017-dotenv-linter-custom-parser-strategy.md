# ADR 0017: Custom TypeScript parser and coordinate mapping for arkenv lint instead of dotenv-linter

## Status

Accepted

## Context

We need to implement a development-time environment variable linter (`arkenv lint`) under issue #481. The linter must perform both schema-based validation (using the project's ArkEnv schema) and static lint checks (syntax, duplicate keys, unquoted spaces, tracked git secrets, etc.).

Crucially, the linter must report all diagnostics using a Unix-standard formatting (`path/to/file.env:line:col - message`) so it integrates cleanly with IDE problem matchers and terminals. This requires mapping validation errors (like type mismatches or missing values) back to their precise line and column coordinates in the original `.env` files.

We evaluated whether we could tap into, wrap, or reuse the core tech of `dotenv-linter` (a popular Rust-based `.env` linter), vs. implementing a custom TypeScript-based parser.

### Options Considered

- **Option 1: Wrap or extend `dotenv-linter`**
  - *Pros:* Reuses an existing tool with pre-built rules for trailing whitespace, incorrect delimiters, etc.
  - *Cons:*
    - **No Plugin System:** `dotenv-linter` is a compiled Rust binary with no extension mechanism for custom validation logic.
    - **No Schema Validation Runtime:** Since it is written in Rust, it cannot transpile/load our TypeScript schemas or run the `arkenv` validator.
    - **No Schema Coordinate Mapping:** It is unaware of our validation logic, so it cannot map schema validation errors back to line/column coordinates. We would still have to write our own custom JS/TS parser to obtain those coordinates.
    - **Dependency Bloat:** Adding `dotenv-linter` would require bundling platform-specific native binaries, using WASM, or forcing users to have it pre-installed. This violates ArkEnv's strict policy of zero external runtime dependencies and minimal footprint.

- **Option 2: Implement a custom, coordinate-aware line scanner/parser in TypeScript**
  - *Pros:*
    - **Zero Dependencies:** Fully portable across all runtimes without binary packages or WASM overhead.
    - **Source Coordinates:** By implementing a simple line scanner (\~50–80 lines of TypeScript), we can trace the precise filename, line number, and column for every parsed environment variable.
    - **Seamless Schema Integration:** We can pass parsed/cascaded variables to the safe schema validator (`arkenv(schema, { safe: true })`) and easily map any returned `EnvIssue`s back to their source coordinates.
    - **Easy Lint Rules:** Other static checks (syntax errors, duplicate keys, unquoted spaces) are trivial to write on top of the parsed line structures.
  - *Cons:* Requires writing and maintaining a basic parser.

## Decision

We adopt **Option 2**. The `arkenv lint` command will use a custom, lightweight, coordinate-aware line scanner written in TypeScript.

1. **Lightweight Tokenizer:** We will parse `.env` files line-by-line in TS, mapping each key definition to its exact `file`, `line`, and `col` coordinate.
2. **Safe Schema Validation:** The parsed/merged environment variables will be run through ArkEnv's safe validator. Diagnostic issues will be translated to line coordinates using the lookup map.
3. **Internal Lint Checks:** All other required checks (syntax errors, unquoted spaces, duplicate keys, Git checks, example placeholder verification) will be run directly against the parsed lines/tokens.

## Consequences

- **Zero Dependency & Portable:** The linter will work seamlessly in Node.js and Bun environments out of the box with no platform-specific installation steps.
- **Highly Accurate Diagnostics:** We can pin-point exact schema validation failures down to the specific line/col of the `.env` file where the bad value is defined.
- **Maintenance:** We must maintain a simple parser that correctly handles common `.env` syntax conventions (comments, quotes, blank lines), but this is very small and well-understood logic.
