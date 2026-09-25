---
"arkenv": major
---

#### Drop JavaScript convention schema discovery

`arkenv check` no longer auto-resolves `env.js`, `src/env.js`, `env.mjs`, or
`src/env.mjs`. Convention discovery is TypeScript only (`env.ts`,
`src/env.ts`). A JavaScript schema still loads when you pass `--schema`.

**BREAKING CHANGE**: If `check` previously found your schema only because a
`.js` or `.mjs` file sat at a convention path, point `--schema` at it:

```json
{
  "scripts": {
    "check": "arkenv check --schema ./env.js"
  }
}
```
