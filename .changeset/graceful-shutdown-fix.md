---
"@arkenv/cli": patch
---

#### Improve Ctrl+C handling and implement graceful shutdown

- The CLI now terminates immediately upon receiving a `SIGINT` (Ctrl+C).
- Implemented a graceful shutdown mechanism that ensures all log output and JSON data are flushed before exiting.
- Added a 2-second timeout and "double Ctrl+C" handler to force termination if a graceful shutdown hangs.
- Proper exit code (130) is now returned on `SIGINT`.
- Fixed a bug where the `init` wizard would continue to subsequent steps after a prompt was cancelled.
