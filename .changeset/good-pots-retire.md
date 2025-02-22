---
"@arkenv/vite-plugin": patch
---

Support `import.meta.env` environment variables

The plugin now supports Vite [Env Variables](https://vite.dev/guide/env-and-mode) out of the box.

This means that by providing a schema, vite will check that the environment variables are valid on build time (or dev time, if you're using `vite` or `vite dev`).
