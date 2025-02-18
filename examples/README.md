# `ark.env` examples

This directory contains a collection of example projects that demonstrate various use cases and features of `ark.env`. Each example is a standalone project that can be run independently.

## Examples

| Name | Description |
| --- | --- |
| [`basic`](./basic) | Minimal example of *using `ark.env` in a [Node.js](https://nodejs.org/) app* for learning the fundamentals. |
| [`with-bun`](./with-bun) | Minimal example of *using `ark.env` in a [Bun](https://bun.sh/) app*. |

## Contributing an example

New examples are welcome! If you'd like to contribute an example:

1. Create a new directory under `examples/`
2. Include a comprehensive `README.md` explaining the example
3. Ensure the example is self-contained and includes all necessary files
4. Add the example to this README's list of examples

Each example follows this basic structure:
```
examples/<example-name>/
├── README.md         # Documentation specific to the example
├── package.json      # Dependencies and scripts
└── src/             # Source code
    └── index.ts     # Entry point
```
