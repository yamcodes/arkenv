# @arkenv/cli

The interactive, zero-dependency scaffolding experience for the [Arkenv](https://arkenv.com) ecosystem.

## Quickstart

Run the initialization command to quickly scaffold your project with Arkenv:

```bash
pnpm dlx @arkenv/cli@latest init
```

*Or using `npx`:*

```bash
npx @arkenv/cli@latest init
```

## Features

- **Interactive Scaffolding**: A guided setup process using `@clack/prompts`.
- **Zero Dependencies**: Lightweight and fast, perfect for one-off project initialization.
- **Multiple Validation Libraries**: Support for [ArkType](https://arktype.io), [Zod](https://zod.dev), and [Valibot](https://valibot.dev).
- **Framework Detection**: Automatically detects your runtime (Node, Bun) and framework (Vite, Solid-Start).

## Usage

The primary command is `init`, which guides you through:

1. Selecting your preferred validation library.
2. Configuring your environment schema.
3. Setting up project-specific options like strict mode and configuration paths.

For more detailed guides and advanced usage, visit our [official documentation](https://arkenv.com/docs/cli).

## License

MIT
