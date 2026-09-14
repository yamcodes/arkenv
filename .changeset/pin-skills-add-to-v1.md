---
"arkenv": patch
---

#### Pin `skills add` to the v1 branch

`arkenv init` now installs the agent skill from `https://github.com/yamcodes/arkenv/tree/v1` so `skills add` resolves the v1 skill instead of the repo default branch.

```bash
npx skills add https://github.com/yamcodes/arkenv/tree/v1
```
