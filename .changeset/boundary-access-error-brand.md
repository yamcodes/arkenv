---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Show `ArkEnvError` when client code reads a server-only variable

If a Client Component (or other browser code) reads a server-only variable such as `DATABASE_URL`, ArkEnv still throws immediately so the secret never reaches the client. The overlay and stack now look like other ArkEnv errors:

```txt
ArkEnvError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

That is a bug in the component, not a bad `.env` file. Fix the access. Do not wrap it in `try/catch`. `instanceof ArkEnvError` still means startup validation failed and still has `.issues`.

Next.js, Vite, and Bun used to print `ArkEnv Error:` (with a space) in front of that sentence. Nuxt used a different sentence. All four now share the message above.

**BREAKING CHANGE**: Update tests or log scrapers that matched the old strings:

```diff
- ArkEnv Error: Attempted to access server environment variable 'DATABASE_URL' on the client.
- Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.
+ Attempted to access server environment variable 'DATABASE_URL' on the client.
```
