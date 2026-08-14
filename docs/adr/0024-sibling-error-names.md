# ADR 0024: Validation class vs attributed native boundary Error

## Status

Accepted

## Context

Validation failures throw a real class with `.issues`. Client reads of server-only keys throw a native `Error` so Vite/Bun generated getters stay import-free of the `@arkenv/core` barrel (ADR 0021). [#1558](https://github.com/yamcodes/arkenv/issues/1558) unified the **message** of those boundary throws, then branded them with `error.name = "ArkEnvError"` so stacks matched validation.

That shared name breaks the Principle of Least Surprise: the console prints `ArkEnvError:`, so callers write `instanceof ArkEnvError`, which is false for boundary throws. The two failures also have different contracts (inspect `.issues` vs do not catch). Options are scored in [docs/design/boundary-error-identity.md](../design/boundary-error-identity.md).

Branding the native throw as `ArkEnvAccessError` (`error.name`) avoids the `instanceof` trap but still looks like a class that does not exist. Leaving the message unattributed makes humans and agents blame Next.js / Nuxt / Vite instead of ArkEnv.

`ArkEnvError` stays the public validation class. Callers already catch it for `.issues`. Do not rename it.

## Decision

Split the **contracts**, not the validation class name:

- **`ArkEnvError`** — the class thrown on schema failure. `instanceof` is true. `.issues` exists. Catch in boot UI / tests.
- **Boundary access** — a native `Error` with `name` left as `"Error"`. No exported class. Vite/Bun getters stay import-free. Do not catch; move the read. Message uses Next.js taint voice (`Do not … since it will leak`) with a last-place breadcrumb for agents, no trailing period. "on the client" not "Client Components", because Nuxt/Vite/Bun share the string:

```txt
Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)
```

Do not set boundary `error.name` to `ArkEnvError` or `ArkEnvAccessError`. No `isArkEnvError` helper, `Symbol.hasInstance`, or `.code` until a concrete switch use case exists.

## Consequences

- `import { ArkEnvError } from "@arkenv/core"` (and `@arkenv/standard`) is unchanged.
- Boundary overlays keep the instruction first (`Error: Do not … since it will leak`) and end with `(prevented by ArkEnv)` so agents do not treat it as a framework taint. Do not brand `error.name`.
- `instanceof ArkEnvError` stays validation-only. It is false for boundary throws because those are a native `Error` with no `.issues`.
