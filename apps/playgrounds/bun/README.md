# ArkEnv with Bun example

This example uses `workspace:*` protocol for the `arkenv` dependency, which Bun doesn't understand. You must install dependencies using pnpm from the repository root first.

## Installation

**Important:** Run these commands in order:

1. Install all workspace dependencies from the repository root:

```bash
cd <repo-root> && pnpm install
```

2. Then install Bun-specific dependencies in this example:

```bash
cd apps/playgrounds/bun && bun install
```

Alternatively, you can use `bun dev` directly after step 1 (Bun will install its dependencies automatically):

```bash
cd apps/playgrounds/bun && bun dev
```

## Running

```bash
bun run index.ts
```

Or in development mode with watch:

```bash
bun dev
```

This project was created using `bun init` in bun v1.3.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
