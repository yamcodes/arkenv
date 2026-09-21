---
"arkenv": major
---

#### Remove `--host-preset` / `-H` aliases from `init`

`arkenv init` now accepts only `--preset` / `-P` for the hosting-provider
preset. The older `--host-preset` and `-H` spellings are rejected as unknown
arguments.

```bash
npx arkenv init --preset vercel
npx arkenv init -P none
```

**BREAKING CHANGE**: Rename `--host-preset` / `-H` to `--preset` / `-P` in
scripts and docs.

```diff
- npx arkenv init -H vercel
+ npx arkenv init --preset vercel
```
