---
"@arkenv/cli": patch
---

#### Support POSIX-style short-flag bundling in CLI parser

Enables combining multiple short flags (e.g. `-yq` instead of `-y -q` or `-yfq` instead of `-y -f -q`) in CLI commands. Flag values starting with `-` (e.g. `init -e -abc`) are preserved without expansion.
