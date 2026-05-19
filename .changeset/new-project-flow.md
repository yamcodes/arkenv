---
"@arkenv/cli": minor
---

#### Integrate "New Project Flow" into `arkenv init`

The `arkenv init` command now supports scaffolding complete projects from verified examples when run in an empty directory.

- **Smart Detection**: Automatically enters "New Project Flow" in empty directories or when `--force` is used.
- **Template Selection**: Interactive prompt to choose from curated examples (Vite, Bun, Zod, etc.).
- **New Flags**:
  - `--template`, `-t`: Skip the prompt and specify a template ID (e.g., `with-vite-react`).
  - `--name`, `-n`: Specify the project name for the scaffolded project.
- **Auto-Install**: Automatically detects and runs the package manager's installation command.

Usage:
```bash
# Interactive flow in an empty directory
arkenv init

# Non-interactive scaffolding
arkenv init --template with-vite-react --name my-new-app
```
