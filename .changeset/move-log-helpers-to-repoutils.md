---
"@arkenv/build": minor
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/bun-plugin": patch
"arkenv": patch
---

#### Centralize build log helpers in `@repo/utils`

Move shared build and watcher log helpers to `@repo/utils` and route remaining ad-hoc `console.*` call sites through them or the CLI `LoggerPort`. Remove the `@arkenv/build/log` subpath introduced in #1294.

Integration packages bundle the helpers via `alwaysBundle` so they keep zero extra runtime dependencies:

```ts
import {
  formatBuildError,
  logBuildError,
  logBuildWarning,
  logWatcherError,
} from "@repo/utils";
```

The CLI uses a `TextReporter`-backed fallback logger for unhandled rejections before the global logger is initialized.

**BREAKING CHANGE:** Drop the `@arkenv/build/log` export; import log helpers from bundled `@repo/utils` usage instead.
