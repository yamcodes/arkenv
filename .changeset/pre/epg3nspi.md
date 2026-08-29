---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Move `arkenv` to peer dependencies in framework plugins

Framework plugins no longer declare `arkenv` as a regular dependency. `arkenv` is now declared as a `peerDependency` with a caret range (`^1.0.0`), ensuring a single shared instance across all plugins and the host application.

This change prevents duplicate instances of `arkenv` in `node_modules`, which could break ArkType structural typing and schema validation at runtime.

Plugins affected:

- `@arkenv/nextjs`
- `@arkenv/nuxt`
- `@arkenv/vite-plugin`
- `@arkenv/bun-plugin`

Before:

```bash
npm install @arkenv/nextjs
```

After:

```bash
npm install arkenv @arkenv/nextjs
```

**BREAKING CHANGE:** Users must now install `arkenv` alongside the plugin. Previously, `arkenv` was automatically pulled in as a regular dependency.
