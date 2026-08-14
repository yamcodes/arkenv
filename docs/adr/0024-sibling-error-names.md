# ADR 0024: Sibling names for validation vs boundary-access errors

## Status

Accepted

## Context

Validation failures throw a real class (`ArkEnvError`) with `.issues`. Client reads of server-only keys throw a native `Error` so Vite/Bun generated getters stay import-free of the `@arkenv/core` barrel (ADR 0021). [#1558](https://github.com/yamcodes/arkenv/issues/1558) unified the **message** of those boundary throws, then branded them with `error.name = "ArkEnvError"` so stacks matched validation.

That shared name breaks the Principle of Least Surprise: the console prints `ArkEnvError:`, so callers write `instanceof ArkEnvError`, which is false for boundary throws. The two failures also have different contracts (inspect `.issues` vs do not catch). Options are scored in [docs/design/boundary-error-identity.md](../design/boundary-error-identity.md).

v1.0.0-alpha is the rename window. Keeping the export name `ArkEnvError` as “the class people already catch” would leave an umbrella word that does not include the access throw.

## Decision

Use **two sibling names**, no umbrella type:

- **`ArkEnvValidationError`** — the class thrown on schema failure. `instanceof` is true. `.issues` exists. Catch in boot UI / tests.
- **`ArkEnvAccessError`** — `error.name` on a native `Error` thrown when client code reads a server-only key. No exported class. Vite/Bun getters stay import-free. Do not catch; fix the access.

Set `error.name` immediately after `new Error(...)` and before anything reads `.stack`, so V8/JSC format the first line as `ArkEnvAccessError:`.

No deprecated `ArkEnvError` alias. No `isArkEnvError` helper, `Symbol.hasInstance`, or `.code` until a concrete switch use case exists.

## Consequences

- `import { ArkEnvValidationError } from "@arkenv/core"` (and `@arkenv/standard`) replaces `ArkEnvError`.
- Boundary stacks print `ArkEnvAccessError: Attempted to access server environment variable '…' on the client.`
- Sentry and similar tools group on `error.name`; the access brand is enough for attribution without a class.
- Callers who caught `instanceof ArkEnvError` must switch to `ArkEnvValidationError`. Mechanical rename; no codemod in-tree for an alpha audience.
