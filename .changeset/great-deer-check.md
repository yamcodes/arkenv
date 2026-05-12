---
"@arkenv/cli": patch
---

#### Improve "done" message text

The output now clearly distinguishes between the local scaffolding and the AI-powered refinement:

```
    1 │
    2 ◇  Next steps ─────────────────────────────────────────────────────────────────╮
    3 │                                                                              │
    4 │  1. Check ./src/env.ts and refine your environment schema.                   │
    5 │  2. Import and use: import { env } from "./src/env"                          │
    6 │  3. (Recommended) Install the AI skill: pnpm dlx skills add yamcodes/arkenv  │
    7 │     Then run /arkenv inside your AI assistant to finish.                     │
    8 │                                                                              │
    9 ├──────────────────────────────────────────────────────────────────────────────╯
   10 │
   11 └  ⛯ ArkEnv scaffolding complete. Happy coding!
```
