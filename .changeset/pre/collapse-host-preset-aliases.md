---
"arkenv": major
---

#### Remove the `--host-preset` / `-H` init aliases

`arkenv init` now accepts only `--preset` / `-P` for hosting presets. The older
`--host-preset` and `-H` forms are rejected as unknown arguments.

**BREAKING CHANGE**: Rename the flag in scripts and docs:

```diff
- arkenv init --host-preset vercel
- arkenv init -H vercel
+ arkenv init --preset vercel
+ arkenv init -P vercel
```
