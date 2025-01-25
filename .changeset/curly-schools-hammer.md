---
"ark.env": patch
---

Support custom user environments

We've added a new optional parameter to `defineEnv` to allow for custom environment variables. This can be used for example in Vite apps by passing `import.meta.env` as the second parameter.
