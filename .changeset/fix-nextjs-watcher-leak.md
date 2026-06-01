---
"@arkenv/nextjs": patch
---

#### Fix development watcher memory and file descriptor leak

Store the active `chokidar` watcher instance on `globalThis.__arkenv_watcher__` and close it when configuring a new watcher instance.
