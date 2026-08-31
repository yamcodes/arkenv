---
"arkenv": minor
"@arkenv/build": patch
"@arkenv/agent-plugin": patch
---

#### Add version freshness pre-flight check to CLI init

`arkenv init` now performs a lightweight pre-flight version freshness check in interactive environments before scaffolding. When an outdated CLI version is detected, users are prompted to seamlessly run the latest release via their package manager's DLX runner (`pnpm dlx`, `bunx`, `yarn dlx`, or `npx`).

- The pre-flight check queries the npm registry with a 1000ms timeout and fails open silently in offline or non-interactive/CI environments.
- Confirmed upgrades invoke the latest version via the active package manager with full TTY stdio inheritance and signal forwarding (`SIGINT`/`SIGTERM`).
- Marketing copy and missing-schema error hints now omit `@latest` across the ecosystem (e.g. `npx arkenv init`).

Usage:

```sh
# Run init interactively (prompts automatically if outdated)
npx arkenv init

# Non-interactive / CI runs bypass the prompt automatically
npx arkenv init --yes
```
