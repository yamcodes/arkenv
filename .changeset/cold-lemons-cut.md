---
"@arkenv/vite-plugin": patch
---

#### Refactor to use `configResolved` hook

Updated the plugin to leverage Vite's `configResolved` hook, allowing access to the fully resolved configuration. This makes the plugin more reliant on Vite's native logic instead of re-implementing or reverse engineering it.
