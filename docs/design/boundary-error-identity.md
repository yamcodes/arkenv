# Boundary vs validation errors: identity options

Status: **decided** — keep `ArkEnvError` (class) plus an attributed native `Error` for boundary access. See [ADR 0024](../adr/0024-sibling-error-names.md). The catalog below is the evaluation that led there.

## The problem

ArkEnv throws in two situations that look related in DevTools and are unrelated in code:

| Failure             | What happened                      | Data                  | What you should do                |
| ------------------- | ---------------------------------- | --------------------- | --------------------------------- |
| **Validation**      | Env values failed the schema       | `.issues: EnvIssue[]` | Catch, inspect, fix env / boot UI |
| **Boundary access** | Client code read a server-only key | None                  | Do not catch; move the read       |

Validation is a real class, `ArkEnvError`, so stacks print `ArkEnvError: …` and `instanceof ArkEnvError` is true.

Boundary access on Vite/Bun is emitted as **import-free generated getters** (ADR 0021): no validator, no `@arkenv/core` barrel (that barrel also exports `type` / `arkenv` and is not a safe tree-shake). Next.js and Nuxt use a runtime proxy instead, but today they follow the same throw shape for one brand across hosts.

Before #1558, the **strings** were the bug:

```txt
ArkEnvError: Errors found while validating environment variables
Error: ArkEnv Error: Attempted to access server environment variable '…' on the client.
Error: Accessing server-side environment variable '…' on the client is not allowed.
```

PR #1567 fixes that by setting `error.name = "ArkEnvError"` on a native `Error`. Stacks become:

```txt
ArkEnvError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

That creates a **second** bug: the Principle of Least Surprise. If the console says `ArkEnvError`, the instinct is `if (e instanceof ArkEnvError)`. That is **false** for boundary throws. Same name, different catch contract.

So the design problem is not “pretty prefixes.” It is:

> How should ArkEnv identify validation failures vs boundary-access failures so that (1) DevTools look like one product, (2) `instanceof` / catch code is not a trap, and (3) Vite/Bun client graphs still do not import the validator or the `@arkenv/core` barrel?

Constraint (3) is **narrower** than “you cannot have a class on the client.” `ArkEnvError` itself is a small `Error` plus `formatIssues` / `styleText` / `indent`. The heavy part is the core **entry**. A tiny subpath (for example `@arkenv/core/error`) could import a class. Inlining `@repo/utils` into each published package already means two copies of the class, so `instanceof` only works if the throw site and the catch site resolve the **same specifier**.

---

## Criteria

Declared weights, so the tier list is not a vibes ranking:

|        Weight | Criterion              | Question                                                                                               |
| ------------: | ---------------------- | ------------------------------------------------------------------------------------------------------ |
|   **Primary** | Least surprise         | Does the console name match the catch API?                                                             |
|   **Primary** | Conceptual integrity   | One name → one contract?                                                                               |
|   **Primary** | Catch honesty          | Does `instanceof` / a guard imply `.issues` iff they exist?                                            |
| **Secondary** | Client isolation       | Vite/Bun getters stay free of ArkType and the core barrel?                                             |
| **Secondary** | Cross-host consistency | Next, Nuxt, Vite, Bun tell the same story?                                                             |
| **Secondary** | Misuse resistance      | Does the API invite catching a “don’t catch this” throw?                                               |
| **Secondary** | Product attribution    | Can a reader tell this throw is from ArkEnv from the console’s first line, not only from stack frames? |
|  **Tertiary** | Simplicity             | How many names, helpers, and docs pages?                                                               |
|  **Tertiary** | DRY                    | One throw helper / one message across hosts?                                                           |
|  **Tertiary** | Composability          | Sentry grouping, TS narrowing, existing `instanceof` catches?                                          |
| **Tie-break** | Elegance               | Few moving parts; no dual meaning; no lies in `.issues`                                                |

v1.0.0-alpha is the rename window. **Keeping `ArkEnvError` as the class name is not an advantage** — it is leftover vocabulary. Migration cost is noted in prose, not used to rank.

Deliberately **not** a goal: making boundary access a supported, recoverable catch path. If nothing needs to `switch` on that throw, do not add `.code`, a helper, or an access class for it.

Legend for the matrix: **Y** strong, **\~** mixed, **N** weak.

---

## Options

### O0 — Status quo (pre-#1558)

Native `Error`, message embeds `ArkEnv Error:` (Next/Vite/Bun) or a different Nuxt sentence. `error.name` is `"Error"`. `instanceof ArkEnvError` is false.

### O1 — Current PR: shared name, native Error

`error.name = "ArkEnvError"`, unprefixed message, no class import. `instanceof` false. Docs: do not catch; `instanceof` is validation-only. No helper, no `Symbol.hasInstance`.

### O2 — Dual-catch on `error.name`

Same throw as O1, but teach `error instanceof Error && error.name === "ArkEnvError"` as the way to catch **both**. (Early #1558 text; later locked out of the PR.)

### O3 — Drop the boundary brand

Boundary stays a plain `Error` (`error.name` remains `"Error"`) with the unified message. The validation class is the only branded name.

What the user actually sees:

```txt
Error: Attempted to access server environment variable 'DATABASE_URL' on the client.
    at Object.get (…generated env module…)
```

How they might still infer “this is ArkEnv”:

- The **message** is distinctive (server env key, “on the client”).
- The **stack** points at ArkEnv-generated getters or the Next/Nuxt proxy.

What they do **not** get: a product token on line 1. DevTools, Sentry title grouping, and “who threw this?” all look like a generic `Error`. That is the original #1558 complaint, minus the doubled `ArkEnv Error:` prefix and the Nuxt wording split.

### O4 — Semantic split, two sibling names

No umbrella type named `ArkEnvError`. Two peer names, both `ArkEnv*`:

- `ArkEnvValidationError` — today’s class, `.issues`, catchable (`instanceof` true).
- Boundary: native `Error` with `error.name = "ArkEnvAccessError"` (or `ArkEnvBoundaryError`). No access class.

Console:

```txt
ArkEnvValidationError: Errors found while validating environment variables
ArkEnvAccessError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

`instanceof ArkEnvValidationError` is the catch API. `instanceof ArkEnvAccessError` is not a thing (no class), so the name does not invite a false `instanceof`. (External option 1, full rename.)

### O4-lite — Keep `ArkEnvError`, only rename the boundary

Validation class stays `ArkEnvError`. Boundary `error.name = "ArkEnvAccessError"`.

This reads as a parent/child (`ArkEnvAccessError` “is an” `ArkEnvError`) that is not true in the type system. Rejected as a ranking winner: v1 is the time to drop the umbrella name, not to keep it as “the class people already catch.”

### O5 — Semantic split, access is a tiny real class

Same names as O4, but `ArkEnvAccessError` lives on a tiny subpath (`@arkenv/core/error` or similar). Generated getters **import that specifier**. `instanceof ArkEnvAccessError` is true; `instanceof ArkEnvValidationError` is false. Isolation holds if the subpath does not re-export the barrel.

### O6 — One class, tiny subpath, real `instanceof`

Generated getters `import { ArkEnvError } from "@arkenv/core/error"` and `throw new ArkEnvError(...)`. App code that imports the same specifier gets true `instanceof`. Constructor still wants `.issues` unless combined with O7/O8.

### O7 — Widen `ArkEnvError`

`ArkEnvError` means “anything ArkEnv threw.” Optional `.issues`, or a discriminant (`kind: "validation" | "boundary"`). `instanceof` is true for both; callers branch on data.

### O8 — `new ArkEnvError([])`

Catchable, `.issues` is empty. Unifies `instanceof` by lying.

### O9 — `Symbol.hasInstance`

Keep a native `Error` with `name = "ArkEnvError"`, but make `instanceof ArkEnvError` return true for anything with that name (and maybe `.issues`). Fakes the catch API.

### O10 — Error codes as primary identity

`e.code = "ERR_ARKENV_VALIDATION" | "ERR_ARKENV_BOUNDARY"` (and similar) on standard `Error`s. Branch on `.code`, not `instanceof` / `name`. (External option 2.)

### O11 — Semantic names + codes

O4 or O5 **and** `.code`. Console uses a distinct `name`; programmatic switch uses `.code`. Node-shaped.

### O12 — Type guard helper

Keep a shared `ArkEnvError` name (O1/O6/O7). Export `isArkEnvValidationError(error): error is ArkEnvError` that checks `instanceof Error`, `'issues' in error`, maybe `name`. Client-safe, no class import required for the guard. (External option 3.) Variants: `isArkEnvError` covering both via `name`.

### O13 — Import the `@arkenv/core` barrel from generated clients

`import { ArkEnvError } from "@arkenv/core"` inside Vite/Bun getters. Relies on tree-shaking to drop ArkType. The barrel is not structured for that.

### O14 — Host-asymmetric throws

Next/Nuxt throw the real class (they already ship a proxy). Vite/Bun keep a branded native `Error`. Docs have two stories.

### O15 — Inline a class copy into generated source

Emit `class ArkEnvError extends Error { ... }` (or a duplicate access class) in the getter module. Local `instanceof` against **that** copy is true; `instanceof` against the user’s `@arkenv/core` import is false.

---

## Matrix

|                           | Surprise | Integrity | Catch honesty | Isolation | Cross-host | Misuse resist | Attribution | Simple | DRY | Compose |
| ------------------------- | :------: | :-------: | :-----------: | :-------: | :--------: | :-----------: | :---------: | :----: | :-: | :-----: |
| O0 Status quo             |     N    |     N     |       Y       |     Y     |      N     |       Y       |      \~     |    Y   |  N  |    N    |
| O1 Current PR             |     N    |     N     |       Y       |     Y     |      Y     |       \~      |      Y      |    Y   |  Y  |    \~   |
| O2 Dual-catch on `name`   |     N    |     N     |       N       |     Y     |      Y     |       N       |      Y      |   \~   |  Y  |    \~   |
| O3 Drop brand             |     Y    |     Y     |       Y       |     Y     |      Y     |       Y       |      N      |    Y   |  Y  |    N    |
| O4 Sibling names          |     Y    |     Y     |       Y       |     Y     |      Y     |       Y       |      Y      |   \~   |  Y  |    \~   |
| O4-lite Umbrella + access |    \~    |     N     |       Y       |     Y     |      Y     |       Y       |      Y      |   \~   |  Y  |    \~   |
| O5 Split, tiny class      |     Y    |     Y     |       Y       |     Y     |      Y     |       \~      |      Y      |   \~   |  Y  |    Y    |
| O6 One class, tiny import |    \~    |     \~    |       \~      |     Y     |      Y     |       N       |      Y      |    Y   |  Y  |    Y    |
| O7 Widen class            |    \~    |     \~    |       \~      |     Y     |      Y     |       N       |      Y      |   \~   |  Y  |    Y    |
| O8 Empty `.issues`        |    \~    |     N     |       N       |     Y     |      Y     |       N       |      Y      |    Y   |  Y  |    \~   |
| O9 `hasInstance`          |    \~    |     N     |       N       |     Y     |      Y     |       N       |      Y      |   \~   |  Y  |    N    |
| O10 Codes as identity     |    \~    |     \~    |       Y       |     Y     |      Y     |       \~      |      N      |    N   |  Y  |    Y    |
| O11 Split + codes         |     Y    |     Y     |       Y       |     Y     |      Y     |       Y       |      Y      |    N   |  Y  |    Y    |
| O12 Helper                |    \~    |     N     |       Y       |     Y     |      Y     |       \~      |      Y      |   \~   |  Y  |    Y    |
| O13 Core barrel           |    \~    |     \~    |       \~      |     N     |      Y     |       N       |      Y      |    Y   |  Y  |    \~   |
| O14 Host split            |     N    |     N     |       \~      |     Y     |      N     |       \~      |      \~     |    N   |  N  |    N    |
| O15 Inlined copy          |     N    |     N     |       N       |     Y     |     \~     |       N       |      Y      |   \~   |  \~ |    N    |

Notes that the grid cannot say:

- **O1 catch honesty is Y** because the *class* still means validation; the trap is the *name*, scored under surprise / integrity.
- **O3 attribution is N:** line 1 is `Error:`. Message + stack can still look like ArkEnv if you already know the wording; a new reader does not get a product token.
- **O4 vs O4-lite:** both split the *boundary* name. O4-lite keeps `ArkEnvError` as an umbrella-shaped word that does not include `ArkEnvAccessError`. Integrity N.
- **O4 vs O5 misuse:** O4 has no class to `instanceof`, so people are less likely to catch access. O5 makes access catchable, which fights “don’t catch this” unless docs are loud.
- **O10 surprise is mixed** because consoles still print `Error: message` unless you *also* set `name`. Codes without names do not solve the original DevTools grouping.
- **O12 catch honesty is Y** for a validation-only guard (`'issues' in error`). An `isArkEnvError` that keys off `name` alone is N (same trap as O2).

---

## How the interesting options actually fail or win

**O1 (current PR)** solves the ticket that was filed: one unprefixed message, one stack prefix, Nuxt aligned, Vite/Bun still import-free. It does it by overloading the word `ArkEnvError`. That is a documentation tax forever. Every new agent and every new user will write `instanceof` once.

**O3 (drop brand)** removes the trap and does not add a second name. The cost is product attribution: the console’s first line is a generic `Error`. You still have a unique message and ArkEnv frames in the stack, but nothing *says* ArkEnv until you read those. If “I need to know this came from ArkEnv” is a requirement, O3 fails it. It is the right answer only if attribution on line 1 is not a requirement.

**O4 (sibling names)** is the cleanest answer to least surprise **without** a new client import and **without** an umbrella type. Console says `ArkEnvAccessError`. There is no class by that name, so nobody writes `instanceof ArkEnvAccessError`. Validation is `ArkEnvValidationError`, which matches `instanceof`. Two peers, both `ArkEnv*`. v1 is the window to retire the export name `ArkEnvError`.

**O4-lite** looks cheaper (keep the class name people already catch) and is the worse dictionary: `ArkEnvError` reads as “all ArkEnv errors,” and `ArkEnvAccessError` then looks like a subtype that is not a subtype. Do not pick this to save a rename.

**O5 (tiny access class)** is O4 with a real `instanceof ArkEnvAccessError`. Worth it only if catching access is a use case. The product says it is not. Paying an import + a public class for a throw you should not catch is extra API.

**O6 / O7 (unify the class)** only make sense if `instanceof ArkEnvError` should mean “ArkEnv threw.” That is a different product: one catch bucket, then inspect `.issues` / `kind`. Isolation is solvable with a subpath (the hole in the original “hard constraint”). The remaining objection is conceptual, not bundler physics. Empty `.issues` (O8) is that product with a lie instead of a discriminant.

**O9 (`hasInstance`)** makes `instanceof` true for objects that are not the class. Cross-realm and duplicated-inline copies still bite. It trains people that `instanceof` is magic. Reject.

**O10 (codes only)** is a good *branching* convention and a bad *identity*. Node still sets `name` (`TypeError`, `ERR_*` on `code`). If ArkEnv’s console still says `Error:`, you have not fixed #1558’s brand. If the console says `ArkEnvError` and identity is `.code`, you have two systems.

**O11 (split + codes)** is the “do it like Node” version of O4/O5: distinct `name` for humans, `.code` for `switch`. Strictly more surface than O4. Worth it if you expect programmatic handling of **both** failures. Weak if boundary remains “don’t catch.”

**O12 (helper)** is the right *shape* (Zod/Axios) for a library that already has a messy identity. It does not *remove* the two-meanings-of-`ArkEnvError` problem; it hides the check. A validation-only guard is honest. A name-based `isArkEnvError` is O2 with a function around it.

**O13 / O14 / O15** are implementation shortcuts. Barrel import risks ArkType in the client. Host split is two docs. Inlined class copies fail `instanceof` against the package the user imported — the same identity bug ADR 0011 inlining already risks across `@arkenv/nextjs` vs `@arkenv/core`.

---

## Combinations worth treating as first-class

Not every pair is a new idea. This one is:

1. **O4 + deprecated alias:** export `ArkEnvError` as a type/value alias of `ArkEnvValidationError` for one prerelease, then delete it. Only if a concrete caller already catches `ArkEnvError` in the wild. Default is a clean break — no alias, no umbrella.

Do **not** add `.code` or an access class unless a real switch/instanceof use case shows up. We do not have one.

---

## Tier list

Ranked for the problem as stated above (brand + catch trap + isolation + attribution), not for “smallest diff.”

### S

- **O4** — `ArkEnvValidationError` (class) and `ArkEnvAccessError` (native `Error` name). Sibling names, no umbrella type. Isolation unchanged. Don’t-catch is in the access name. v1 is the time to rename the class.

### A

- **O5** — only if catching access becomes a real use case. It is not one today; the class would be bait.
- **O11** — only if something needs to `switch`. It does not; extra API.

### B

- **O1 (current PR)** — right fix for the *string* ticket; same name on two different contracts.
- **O3** — honest catch API, but line 1 is `Error:` so attribution is only message + stack.
- **O4-lite** — avoids the `instanceof` trap and reintroduces an umbrella word that does not include the access throw.
- **O12 (validation-only helper)** — extra on top of O4; not a substitute. No name-keyed `isArkEnvError`.
- **O6 / O7** — coherent only if the product is “one catch bucket.” That fights “don’t catch boundary.”

### C

- **O2** — documents the trap instead of removing it.
- **O10 alone** — codes without a distinct console `name` do not fix what users see.

### D

- **O8** empty `.issues`
- **O9** `Symbol.hasInstance`
- **O13** core barrel in the client
- **O14** host-asymmetric story
- **O15** inlined duplicate class

### F

- **O0** status quo — three strings, generic `Error:` prefix, Nuxt off on its own wording.

---

## Recommendation

**Done.** ADR 0024 records the choice: keep `ArkEnvError` (class) for schema failures, and a native `Error` in Next.js taint voice (`Do not … since it will leak sensitive data (prevented by ArkEnv)`) for boundary access. No `error.name` brand on the boundary throw, no helper, no access class.
