---
"@arkenv/vite-plugin": patch
---

#### Fix security issue where server-only environment variables were exposed to client code

The plugin now automatically filters to only expose variables matching Vite's configured prefix (defaults to `VITE_`), preventing sensitive server-side configuration from leaking into the client bundle.