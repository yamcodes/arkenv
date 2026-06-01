---
"@arkenv/cli": patch
---

#### Restrict Next.js shared scaffold templates to NODE_ENV

Treat `PORT` as a server-only variable instead of a shared variable in scaffold templates and strict layout generators. This ensures that custom variables or variables like `PORT` are not placed in `shared` sections, avoiding potential client-side hydration mismatches in Next.js applications.
