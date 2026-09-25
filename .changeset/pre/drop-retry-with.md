---
"@arkenv/agent-plugin": patch
---

#### Point init refusals at nextActions

Agent instructions now tell you to retry only when a refusal's `nextActions` include a `run-command` with `--force`.
