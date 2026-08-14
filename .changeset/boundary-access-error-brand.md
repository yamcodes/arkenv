---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Unify the error when client code reads a server-only variable

On Next.js, Nuxt, Vite, and Bun, reading a server-only key from the client now throws:

```txt
ArkEnvError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

Do not catch it. `instanceof ArkEnvError` is for validation failures (`.issues`).

**BREAKING CHANGE**: Update tests that matched the old strings:

```diff
- ArkEnv Error: Attempted to access server environment variable 'DATABASE_URL' on the client.
- Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.
+ Attempted to access server environment variable 'DATABASE_URL' on the client.
```
