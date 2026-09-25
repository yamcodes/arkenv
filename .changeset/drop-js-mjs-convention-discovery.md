---
"arkenv": major
---

#### Drop `.js` / `.mjs` convention schema discovery

`arkenv check` no longer auto-discovers `env.js`, `src/env.js`, `env.mjs`, or `src/env.mjs`. Convention discovery now probes TypeScript paths only (`env.ts`, `src/env.ts`), matching what `arkenv init` scaffolds. A JavaScript or ESM schema is still loaded when you pass it explicitly:

```bash
npx arkenv@latest check --schema ./env.js
```

**BREAKING CHANGE**: If `arkenv check` previously found your schema only
because `env.js`, `src/env.js`, `env.mjs`, or `src/env.mjs` existed, point
`--schema` at it in your scripts, or move it to a flat `env.ts` /
`src/env.ts`. Discovery no longer treats those JavaScript paths as
convention candidates.
