---
"@arkenv/cli": patch
---

#### Add interactive "Select Example" step to `arkenv init` wizard

During `arkenv init`, you can now choose to start with a pre-configured example:
- **Vite + Zod**: Full-stack validation with Zod and Vite.
- **Next.js + ArkType**: Optimized for Next.js and ArkType.
- **Basic + Valibot**: Lightweight validation with Valibot.

Selecting an example will automatically populate your `env.ts` and `.env` files with template content.
