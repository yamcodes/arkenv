---
"@arkenv/core": major
"@arkenv/standard": major
"@arkenv/build": patch
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Split validation and boundary-access error names

Give each failure its own name so the console line matches the catch API. `ArkEnvError` is gone; there is no deprecated alias.

Schema failures throw `ArkEnvValidationError` (`.issues` present). Catch that class when you inspect issues — custom boot UI, tests, or a wrapper:

```ts
import arkenv, { ArkEnvValidationError } from "@arkenv/core";
// or: import { ArkEnvValidationError } from "@arkenv/standard";

try {
  arkenv({ PORT: "number.port" }, { env: { PORT: "abc" } });
} catch (error) {
  if (error instanceof ArkEnvValidationError) {
    console.error(error.message);
    console.error(error.issues);
  }
  throw error;
}
```

Reading a server-only key from client code is a misuse, not a bad `.env` file. Next.js, Nuxt, Vite, and Bun throw a native `Error` named `ArkEnvAccessError` (no exported class, no `.issues`):

```txt
ArkEnvAccessError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

Do not catch that throw; move the read. `instanceof ArkEnvValidationError` is false here because there are no issues. Vite and Bun client modules still do not import the validation class.

**BREAKING CHANGE**: Rename `ArkEnvError` to `ArkEnvValidationError` in imports and `instanceof` checks. Boundary stacks now print `ArkEnvAccessError:`; update tests that matched the old strings.

```diff
- import { ArkEnvError } from "@arkenv/core";
- if (error instanceof ArkEnvError) { /* .issues */ }
+ import { ArkEnvValidationError } from "@arkenv/core";
+ if (error instanceof ArkEnvValidationError) { /* .issues */ }

- ArkEnv Error: Attempted to access server environment variable 'DATABASE_URL' on the client.
- Error: ArkEnvError: Attempted to access…
- Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.
+ ArkEnvAccessError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```
