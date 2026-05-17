---
"@arkenv/cli": patch
---

#### Improve Ctrl+C handling and implement graceful shutdown

- Implemented graceful shutdown for `SIGINT` (Ctrl+C) to flush logs and JSON data, with a 2-second safety timeout and support for immediate exit on a second Ctrl+C.
- Corrected exit code (130) for `SIGINT` terminations.
- Fixed a bug where the `init` wizard would continue after a prompt was cancelled.
