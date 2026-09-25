---
"@arkenv/tanstack-addon": patch
---

#### Point TanStack add-on dependencies at the current release

Scaffolded TanStack Start apps now install `@arkenv/core`, `@arkenv/standard`, and `@arkenv/vite-plugin` at `^1.0.0-rc.2`, which matches the versions on npm `latest` and still accepts `1.0.0` when it publishes.

Usage:

```bash
npx @tanstack/cli create my-app --add-ons https://arkenv.js.org/tanstack/info.json
```
