---
"arkenv": patch
---

#### Pin `skills add` to the v1 branch

`arkenv init` always installs the skill from the explicit v1 tree URL so installs never depend on the repo default branch (still `dev`/v0 until an optional flip):

```bash
npx skills add https://github.com/yamcodes/arkenv/tree/v1
```
