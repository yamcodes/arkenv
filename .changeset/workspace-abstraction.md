---
"@arkenv/cli": patch
---

#### Introduce `Workspace` abstraction for project mutation

- Centralized file system and AST manipulation logic into a new `Workspace` class.
- Improved robustness of Vite plugin injection using `magicast`.
- Enhanced `tsconfig.json` updates using `jsonc-parser`.
- Added comprehensive unit tests for the `Workspace` abstraction.
