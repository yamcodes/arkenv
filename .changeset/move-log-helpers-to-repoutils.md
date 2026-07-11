---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/bun-plugin": patch
"arkenv": patch
---

#### Centralize build log helpers in `@repo/utils`

Move shared build and watcher log helpers to `@repo/utils` and route remaining ad-hoc `console.*` call sites through them or the CLI `LoggerPort`.

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
