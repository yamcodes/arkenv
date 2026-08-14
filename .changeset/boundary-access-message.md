---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Clarify the error when client code reads a server-only env var

If a Client Component (or browser bundle) reads a server-only key, the overlay now says:

```txt
Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data
```

Do not catch this error. Move the read to the server.
