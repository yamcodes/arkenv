---
"@arkenv/cli": patch
---

#### Add hosting presets option to init CLI

Support Vercel and Netlify presets when initializing a project via `arkenv init`.

Usage:

1. Run initialization in an existing project:
   ```bash
   npx arkenv init
   ```
2. Select Vercel or Netlify from the "Select a hosting provider preset (optional)" prompt.
3. The generated environment configuration file (`env.ts`) will contain pre-typed environment variables, automatically prefixing them based on the active framework (e.g. `NEXT_PUBLIC_VERCEL_ENV` and `NEXT_PUBLIC_VERCEL_URL` for Next.js).
