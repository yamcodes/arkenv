---
"@arkenv/core": patch
"@arkenv/standard": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Document the zero-dependency engines

Call out that `@arkenv/core` and `@arkenv/standard` have zero runtime dependencies (ArkType is a peer of core; standard has no peers) in package descriptions, keywords, and READMEs. Framework plugin READMEs now point at those engines instead of claiming zero dependencies themselves.
