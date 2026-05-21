---
"@arkenv/cli": patch
---

#### Validate valued CLI flags and reject missing values

Add parser-level validation to reject flags that require a value (e.g. `--example` or `-e`) when they are passed without one. A validation error message is set, and the CLI exits with status code 1.
