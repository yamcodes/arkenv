---
"@arkenv/vite-plugin": patch
---

#### Fix Vite types backwards compatibility

Externalize `vite` to support all Vite versions by using the consumer's installed types - even versions prior to what the plugin was built on.

This includes support for Vite 6, 5, all the way back to Vite 2.
