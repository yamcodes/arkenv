---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Brand client/server boundary access errors as `ArkEnvError`

Boundary access throws (reading a server-only env key on the client) are still native `Error`s — they do not import or construct `ArkEnvError` — but they now set `error.name = "ArkEnvError"` and use one unprefixed message across Next.js, Nuxt, Vite, and Bun:

```ts
const error = new Error(
  `Attempted to access server environment variable '${key}' on the client.`,
);
error.name = "ArkEnvError";
throw error;
```

Stacks print `ArkEnvError: Attempted to access…`. Catch validation and boundary failures with `error instanceof Error && error.name === "ArkEnvError"` (`instanceof ArkEnvError` stays validation-only).

**BREAKING CHANGE**: Boundary access messages no longer use the `ArkEnv Error:` prefix (Next/Vite/Bun) or Nuxt's `Accessing server-side…` wording. Match on `error.name === "ArkEnvError"` or the new message text.
