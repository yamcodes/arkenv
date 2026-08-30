---
"@arkenv/cli": patch
"@arkenv/build": patch
---

#### Add version freshness pre-flight check and prompt to run latest version on init

- Implement pre-flight version check in the CLI during interactive `init` execution against the npm registry with a 1000ms timeout.
- Prompt the user when an outdated CLI version is executed to run the latest published release via the active package manager's DLX tool (`pnpm dlx`, `bunx`, `yarn dlx`, or `npx`).
- Forward process signals (`SIGINT`, `SIGTERM`) and standard I/O to the spawned child process, and exit cleanly on completion.
- Fail open silently without blocking in non-interactive/CI environments or when network errors occur.
- Simplify marketing copy and error message hints to omit `@latest` (e.g. `npx @arkenv/cli init`).
