---
"arkenv": minor
---

#### Add hosting presets to `arkenv init`

Support optional Vercel and Netlify presets when initializing a project. Preset fields render through validator dialects and client keys use each framework strategy's `clientPrefix`.

Usage:

```bash
npx arkenv@alpha init --host-preset vercel
```

Or select **Vercel** / **Netlify** in the interactive hosting-preset step. Generated schemas include typed keys such as `VERCEL_ENV` (and `NEXT_PUBLIC_VERCEL_ENV` on Next.js).
