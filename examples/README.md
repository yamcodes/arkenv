# ArkEnv examples

This directory contains a collection of example projects that demonstrate various use cases and features of ArkEnv. Each example is a standalone project that can be run independently.

## Examples

> [!NOTE]
> The examples listed below are written in TypeScript out of convention.
> ArkEnv does _not_ require TypeScript. If you prefer plain JavaScript, see [basic-js](https://github.com/yamcodes/arkenv/tree/main/examples/basic-js) for a basic example.

| Name                                                                                             | Description                                                                                              |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`basic`](https://github.com/yamcodes/arkenv/tree/main/examples/basic)                           | Minimal example of *using ArkEnv in a [Node.js](https://nodejs.org/) app* for learning the fundamentals. |
| [`with-bun`](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun)                     | Minimal example of *using ArkEnv in a [Bun](https://bun.sh/) app*.                                       |
| [`with-bun-react`](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun-react)         | Minimal example of *using ArkEnv in a [Bun+React](https://bun.com/docs/guides/ecosystem/react) full-stack app*.                                       |
| [`with-vite-react`](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react) | Minimal example of *using ArkEnv in a [Vite](https://vite.dev/)+[React](https://react.dev/) app*.                                    |

## Contributing an example

New examples are welcome! If you'd like to contribute an example:

1. Create a new directory under `examples/`
2. Include a comprehensive `README.md` explaining the example
3. Ensure the example is self-contained and includes all necessary files
4. Add the example to this README's list of examples

Each example follows this basic structure:
```
examples/with-<tool-1>-...<tool-n>/
├── README.md         # Documentation specific to the example
├── package.json      # Dependencies and scripts
└── src/             # Source code
    └── index.ts     # Entry point
```
