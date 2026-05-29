---
"@arkenv/cli": patch
---

#### Automatically detect installed arkenv AI skill

During initialization, check if the `arkenv` agent skill is already present in the workspace. If detected, the installation prompt and setup are bypassed, defaulting to `false`, and an informational message confirming the detection is logged.
