---
"arkenv": patch
---

#### Pin `skills add` to the v1 branch during pre-release

`arkenv init` now picks the skill source from the running CLI version: pre-release builds install from `https://github.com/yamcodes/arkenv/tree/v1`, and stable (GA) builds use the short `yamcodes/arkenv` form once v1 is the default branch.

```bash
# pre-release (alpha / rc)
npx skills add https://github.com/yamcodes/arkenv/tree/v1

# GA
npx skills add yamcodes/arkenv
```
