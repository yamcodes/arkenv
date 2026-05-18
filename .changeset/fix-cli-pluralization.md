---
"@arkenv/cli": patch
---

#### Fix pluralization and 0-case in environment variable detection messages

The CLI now correctly handles singular and plural cases for detected environment variables (e.g., "1 key" vs "2 keys"). It also correctly suppresses the prompt when no variables are detected.
