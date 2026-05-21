---
"@arkenv/cli": patch
---

#### Allow scaffolding into non-empty directory when `--force` is used

Ensure `--force` permits new-project scaffolding into a non-empty directory (e.g. `.`) while preventing silent overwrites of user files via a preflight collision check.
