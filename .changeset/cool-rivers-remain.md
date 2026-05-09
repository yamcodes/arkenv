---
"@arkenv/cli": patch
---

#### Auto-detect `.env.example` keys during init and suggest schema

- Robust parsing of `.env.example` to extract variable keys
- Integration with the `init` wizard to suggest keys for scaffolding
- Minimal scaffolding templates without introductory comments or platform notes
- Simplified CLI output with live dependency installation progress
- Updated CLI documentation and added post-scaffold guidance to refine types
