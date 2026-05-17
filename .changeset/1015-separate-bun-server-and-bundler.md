---
"@arkenv/cli": minor
---

#### Refine framework terminology and detection in `arkenv init`

The `arkenv init` command now uses clearer terminology and more robust detection to distinguish between server-side runtime usage and client-side bundling integrations.

- **Refined Terminology**:
    - **Vanilla**: Renamed from "Node.js" to reflect runtime-only usage across Node.js, Bun, and Deno. Focused on **server-side** validation.
    - **Bun Fullstack**: Dedicated flow for Bun applications involving **client-side** bundling.
    - **Vite**: Focused on **client-side** and build-time validation.
- **Robust Detection**:
    - Improved detection of **Bun Fullstack** setups by scanning for `Bun.serve` or `Bun.build` usage.
    - If no bundling features are detected, the CLI defaults to **Vanilla** (even when running on Bun) to avoid unnecessary plugin overhead.
- **Streamlined Wizard Flow**:
    - The initial question now asks for your "framework or build tool" with clear hints for **server-side** vs **client-side** usage.
    - The Bun Fullstack flow is now more focused: it defaults to a `Bun.serve` integration and provides an optional step to bootstrap a `Bun.build` script.
- **Improved Scaffolding**: Generated code templates now include helpful comments clarifying whether the configuration is intended for server-side or client-side validation.
