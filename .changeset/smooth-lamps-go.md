---
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Improve internal types

Fixed "Type instantiation is excessively deep and possibly infinite" errors when using the plugins with complex ArkType schemas. This change improves type stability during the build process by optimizing how generics are passed to the validation logic.
