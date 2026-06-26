---
"@arkenv/nextjs": patch
---

#### Add build-time environment variable validation

Automatically validate all required environment variables at build time (e.g. during `next build`) inside the config plugin. Missing or malformed environment variables will cause the build to fail immediately with a clear, actionable ArkEnv error, preventing runtime failures.
