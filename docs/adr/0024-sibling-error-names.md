# ADR 0024: Validation class vs attributed native boundary Error

## Status

Accepted

## Context

Validation failures throw a real class with `.issues`. Client reads of server-only keys throw a native `Error` so Vite/Bun generated getters stay import-free of the `@arkenv/core` barrel (ADR 0021). [#1558](https://github.com/yamcodes/arkenv/issues/1558) unified the **message** of those boundary throws, then branded them with `error.name = "ArkEnvError"` so stacks matched validation.

That shared name breaks the Principle of Least Surprise: the console prints `ArkEnvError:`, so callers write `instanceof ArkEnvError`, which is false for boundary throws. The two failures also have different contracts (inspect `.issues` vs do not catch). Options are scored in [docs/design/boundary-error-identity.md](../design/boundary-error-identity.md).

Branding the native throw as `ArkEnvAccessError` (`error.name`) avoids the `instanceof` trap but still looks like a class that does not exist. Leaving the message unattributed (`Error: Cannot access…`) makes humans and agents blame Next.js / Nuxt / Vite instead of ArkEnv.

v1.0.0-alpha is the rename window. Keeping the export name `ArkEnvError` as “the class people already catch” would leave an umbrella word that does not include the access throw.

## Decision

Split the **contracts**, not the `Error.name` of the boundary throw:

- **`ArkEnvValidationError`** — the class thrown on schema failure. `instanceof` is true. `.issues` exists. Catch in boot UI / tests.
- **Boundary access** — a native `Error` with `name` left as `"Error"`. No exported class. Vite/Bun getters stay import-free. Do not catch; fix the access. Attribute the library in the **message**, last in the sentence, with no trailing period (Next.js overlay style):

```txt
Error: Access to server-only key 'DATABASE_URL' on the client was prevented by ArkEnv
```

No `error.name` rewrite (`ArkEnvAccessError`, `ArkEnvError`, …). No deprecated `ArkEnvError` alias. No `isArkEnvError` helper, `Symbol.hasInstance`, or `.code` until a concrete switch use case exists.

## Consequences

- `import { ArkEnvValidationError } from "@arkenv/core"` (and `@arkenv/standard`) replaces `ArkEnvError`.
- Boundary overlays match a framework tripwire (`Error:`), with `ArkEnv` as grammatical attribution so search and agents land on this library.
- `instanceof ArkEnvValidationError` stays validation-only. There is no `instanceof` for boundary access.
- Callers who caught `instanceof ArkEnvError` must switch to `ArkEnvValidationError`. Mechanical rename; no codemod in-tree for an alpha audience.
