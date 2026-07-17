---
"arkenv": major
---

#### Drop the `-e` short alias for `init --example`

**BREAKING CHANGE**: The `-e` short alias is no longer recognized. Its long form, `--example`, continues to work exactly as before.

Across the broader CLI ecosystem, `-e` almost universally means `--env` / `--environment`. For a type-safe environment variable library, mapping `-e` to `--example` is a sharp trap: AI agents instinctively reach for `arkenv init -e NODE_ENV=production`, which silently bound to `--example` and consumed the next token as the example name. `-e` is now permanently reserved so it stays free for a future `--env` / `--environment` option. Passing `-e` — standalone or inside a bundle like `-ye` — now fails fast with the standard `Unknown argument: -e` error.

Migration: replace the short alias with its long form.

```bash
# Before
arkenv init -e with-vite-react

# After
arkenv init --example with-vite-react
```
