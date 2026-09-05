---
"@arkenv/tanstack-addon": minor
---

#### Add official TanStack CLI add-on for ArkEnv

The TanStack CLI add-on is now available for generating and configuring ArkEnv in TanStack Start applications.

Features include:
- Multi-validator support (ArkType by default; configurable for Zod or Valibot)
- Automated `vite.config.ts` setup with `@arkenv/vite-plugin`
- Typesafe `src/env.ts` schema definition with server secret isolation
- Scaffolding of an interactive demo route at `/demo/arkenv` demonstrating client-side secret protection

Usage:

```bash
npx @tanstack/cli create my-app --add-ons https://arkenv.js.org/tanstack/info.json
```

Or add to an existing project:

```bash
npx @tanstack/cli add https://arkenv.js.org/tanstack/info.json
```
