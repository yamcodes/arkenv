---
"arkenv": major
---

#### Remove programmatic AST schema mutation and preset command

The `arkenv preset apply` and `arkenv preset remove` commands, along with programmatic AST and comment-marker schema mutation, have been removed from the CLI.

Hosting presets (Vercel, Netlify, Cloudflare, Railway, Render, Fly.io) remain available during initial project scaffolding via `arkenv init --preset <name>` and are documented as copyable code snippets in the docs.

**BREAKING CHANGE**: The `arkenv preset` command and `// @arkenv-preset-start` comment marker management have been removed. Use `arkenv init --preset <provider>` when scaffolding new projects, or copy provider variable definitions directly into `./env.ts` for existing schemas.
