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

Schema failures throw `ArkEnvValidationError` (`instanceof` true, `.issues` present). Reading a server-only key on the client throws a native `Error` named `ArkEnvAccessError` (no class, no `.issues`). Do not catch the access throw; fix the read.

```txt
ArkEnvAccessError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

**BREAKING CHANGE**: Rename the validation class. There is no codemod; search-replace `ArkEnvError` → `ArkEnvValidationError` in catch blocks. Update tests that matched old boundary strings:

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
