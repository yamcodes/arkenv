---
"@arkenv/core": patch
"@arkenv/standard": patch
"arkenv": patch
---

#### Inspect `env.ts` from the CLI without validating the environment

The CLI can now load a project's flat `env.ts` and read declared keys even when the environment is empty. `arkenv()` still validates as usual when the app runs.
