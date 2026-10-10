---
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
"@arkenv/rsbuild-plugin": patch
---

#### Include 1.0.0 prereleases in framework plugin core peers

Optional `@arkenv/core` and `@arkenv/standard` peers on the Next.js, Nuxt,
Vite, Bun, and Rsbuild plugins now use `^1.0.0-0`. Installing a plugin
together with `@arkenv/core@1.0.0-rc.4` and `@arkenv/standard@1.0.0-rc.4`
resolves on npm 11. The peers stay optional. The range matches `1.0.0`
prereleases and stable 1.x below `2.0.0`.

```bash
npm install @arkenv/nuxt @arkenv/core@1.0.0-rc.4 @arkenv/standard@1.0.0-rc.4
```

```json
{
  "peerDependencies": {
    "@arkenv/core": "^1.0.0-0",
    "@arkenv/standard": "^1.0.0-0"
  },
  "peerDependenciesMeta": {
    "@arkenv/core": { "optional": true },
    "@arkenv/standard": { "optional": true }
  }
}
```
