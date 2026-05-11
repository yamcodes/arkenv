---
name: arkenv-cli
description: CLI for ArkEnv to initialize and manage environment variable validation.
---

# ArkEnv CLI

The ArkEnv CLI helps you set up and manage ArkEnv in your project.

## When to use

Use this skill when:
- You want to initialize ArkEnv in a new or existing project.
- You need to scaffold a schema file.
- You want to automatically configure TypeScript for ArkEnv.

## Commands

### `init`

Set up ArkEnv in your project. It will:
1. Detect your framework (Vite, Bun, etc.).
2. Ask for the path to your schema file.
3. Install necessary dependencies.
4. Update `tsconfig.json` to enable `strict` mode if needed.

```bash
pnpm dlx @arkenv/cli@latest init
```

#### Options

- `--yes`, `-y`: Skip prompts and use recommended defaults.
- `--help`, `-h`: Show help message.

## Best Practices

1. **Use the CLI for first-time setup**: It ensures all necessary dependencies and configurations are in place.
2. **Review scaffolded code**: The CLI provides a good starting point, but you should refine the schema to match your application's needs.
