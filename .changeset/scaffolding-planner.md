---
"@arkenv/cli": patch
---

#### Improve reliability and transparency of initialization process

Improved the `init` command to be more robust and informative:
- **Resilient Scaffolding**: The initialization process is now more atomic, validating the plan before applying changes to minimize partial configurations on failure.
- **Enhanced Debugging in Quiet Mode**: When running with `--quiet` (common in CI), output from dependency installation is now buffered and only displayed if the installation fails, providing critical context without cluttering successful runs.
- **Improved Framework Detection**: Auto-detection of Bun environments is now more reliable, correctly identifying the runtime even when dependencies are not yet installed.
- **Clearer Error Reporting**: Provides more specific error messages and instructions when individual scaffolding steps fail.
