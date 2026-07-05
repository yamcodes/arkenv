---
"@arkenv/nuxt": patch
---

#### Add build-time validation and dynamic runtime config support

- **Build-time validation**: Added automatic validation of environment variables against your schema during dev server startup and production build. Missing or invalid variables will now fail the build immediately (previously, validation was not run during build).
- **Dynamic runtime overrides**: Environment variables are now resolved dynamically at runtime rather than at import time. This allows you to swap environment variable values at runtime (e.g., in different deployment environments) without needing to rebuild the application.
