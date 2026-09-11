---
"@arkenv/nextjs": patch
---

#### Widen the React peer dependency range

Replace the workspace `catalog:` alias for the published React peer dependency with `"^18.2.0 || ^19.0.0"` so installs are not pinned to a single React version.
