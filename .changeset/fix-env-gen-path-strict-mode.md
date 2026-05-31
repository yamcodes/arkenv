---
"@arkenv/cli": patch
"@arkenv/nextjs": patch
---

#### Fix env.gen import path in strict layout and export default alias

Correct the hardcoded import path to generated factory in Next.js 3-file strict mode client template. Also export `createEnv` as default export (aliased as `arkenv`) in the generated `env.gen.ts` file.
