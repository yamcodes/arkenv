# `@arkenv/cli`

The interactive, zero-dependency scaffolding experience for the [ArkEnv](https://arkenv.js.org) ecosystem.

<br />

<br />

<br />

## [Read the docs →](https://arkenv.js.org/docs/cli)

<br />

```sh
npx @arkenv/cli@latest init
```

## Related

- [ArkEnv](https://arkenv.js.org) - Core library and docs
- [ArkType](https://arktype.io/) - Underlying validator / type system

## Architecture & Development

This CLI is built with a port-and-adapter architecture to remain flexible and testable. See [ARCHITECTURE.md](./ARCHITECTURE.md) for details on the codebase design, architecture rules, and how to use the interactive testing scripts.

### Local Environment Adapters (`Node*`)

Implementations prefixed with `Node` (e.g., `NodeWorkspace`, `NodeProjectScanner`) represent the standard local development environment. They utilize standard `node:*` APIs (like `node:fs` and `node:child_process`) which are universally supported across modern runtimes including Node.js, Bun, and Deno. This naming reflects the API standard used rather than a runtime restriction.

## License

MIT
