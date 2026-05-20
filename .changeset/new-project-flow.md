---
"@arkenv/cli": minor
---

#### Integrate "New Project Flow" into `arkenv init`

The `arkenv init` command now supports scaffolding complete projects from verified examples when run in an empty directory.

- **Smart Detection**: Automatically enters "New Project Flow" in empty directories or when `--force` is used.
- **Example Selection**: Interactive prompt to choose from curated examples (Vite, Bun, Zod, etc.).
- **New Flags**:
  - `--example`, `-e`: Skip the prompt and specify an example ID (e.g., `with-vite-react`).
  - `--name`, `-n`: Specify the project name for the scaffolded project.
- **Auto-Install**: Automatically detects and runs the package manager's installation command.

Usage:
```bash
# Interactive flow in an empty directory
arkenv init

# Non-interactive scaffolding
arkenv init --example with-vite-react --name my-new-app
```
