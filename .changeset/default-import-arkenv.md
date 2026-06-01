---
"@arkenv/cli": patch
---

#### Update Next.js scaffold templates to use default import `arkenv`

Change the generated `env.ts` templates to import the default `arkenv` factory from the generated config helper instead of the named `createEnv` import, ensuring compatibility with the ArkType IDE extension.
