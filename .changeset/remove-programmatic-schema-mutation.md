---
"arkenv": minor
---

#### Remove programmatic AST schema mutation and preset command

The `arkenv preset apply` and `arkenv preset remove` commands, along with programmatic AST and comment-marker schema mutation, have been removed from the CLI.

Hosting presets (Vercel, Netlify, Cloudflare, Railway, Render, Fly.io) remain available during initial project scaffolding via `arkenv init --preset <name>` and are documented as copyable code snippets in the docs.
