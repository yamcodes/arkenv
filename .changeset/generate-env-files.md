---
"@arkenv/cli": patch
---

#### Generate `.env` and `.env.example` files during initialization

- Scaffold default `.env` and `.env.example` files if missing to prevent Node/tsx `--env-file` boot crashes.
- Parse existing `.env` file and securely strip all values to generate `.env.example` when `.env.example` is missing to avoid leaking user credentials to source control.
- Automatically check and update `.gitignore` in existing projects to ignore `.env` and `.env.local` files.
- Skip overwriting pre-existing files when their scaffolding action is set to `"create"`.
