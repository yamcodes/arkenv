---
"@arkenv/cli": patch
---

#### Deepen the Reporter (Output System)

Refactored the internal `Logger` into a more robust `Reporter` abstraction with specific adapters:
- `TextReporter`: Standard CLI output with colors and spinners.
- `JsonReporter`: Structured JSON output to stdout, interactive logs to stderr.
- `SilentReporter`: Suppresses output for quiet mode.
- `MemoryReporter`: In-memory log storage for improved testability.

This decoupling improves maintainability and allows for easier verification of CLI output in tests without stdout interception.
