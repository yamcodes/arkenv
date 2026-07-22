# ArkEnv Bun + React example

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This example uses the canonical `env` object surface: one `import { env } from "./env"` serves both the `Bun.build` client bundle (inlined `BUN_PUBLIC_*` values + server-key guards) and `Bun.serve` server code (boot-time validation against the real environment).
