---
"@arkenv/cli": patch
---

#### ArkEnv CLI

Introducing the `@arkenv/cli` tool to easily scaffold ArkEnv inside your project. 

The CLI provides an interactive wizard to onboard your project to ArkEnv with optimal configuration for your specific framework and schema validator.

**Features:**
- **Framework Detection**: Automatically detects if you are using Vite, Bun, or Node.js to provide the correct installation instructions.
- **Validator Selection**: Supports scaffolding environment templates using ArkType (recommended), Zod, or Valibot.
- **Strict Mode Enforcement**: Checks and prompts to enforce `strict: true` in your `tsconfig.json` for proper type safety.

**Usage:**

Run the CLI in your project root using your preferred package manager:

```bash
pnpm dlx @arkenv/cli init
# or
npx @arkenv/cli init
# or 
bunx @arkenv/cli init
```
