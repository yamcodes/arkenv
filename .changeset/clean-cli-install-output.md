---
"@arkenv/cli": patch
---

#### Improve CLI UI and fix installation output

- Display CLI version on the help page and at startup
- Fix "doubling up" of terminal output during dependency installation by piping process output
- Resolve Node.js DEP0190 deprecation warning in scaffolding logic
