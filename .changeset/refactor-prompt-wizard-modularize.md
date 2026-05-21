---
"@arkenv/cli": patch
---

#### Refactor prompt wizard and steps to be pure and typesafe

Refactored the interactive prompt wizard and individual steps to be pure, modular, and typesafe. Steps now accept explicit configuration options and return normalized results instead of reading the filesystem directly or relying on global mock state.
