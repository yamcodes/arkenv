# `ark.env` examples

This directory contains a collection of example projects that demonstrate various use cases and features of `ark.env`. Each example is a standalone project that can be run independently.

## Examples

- [`basic`](./basic) - A minimal example showing how to use `ark.env` in a Bun application with type-safe environment variables.

## Running an example

Each example is a self-contained project with its own `package.json` and dependencies. To run an example:

1. Navigate to the example directory:
    ```bash
    cd examples/<example-name>
    ```

2. Install dependencies:
    ```bash
    bun install
    ```

3. Follow the example-specific instructions in its README.

## Contributing examples

We welcome new examples! If you'd like to contribute an example:

1. Create a new directory under `examples/`
2. Include a comprehensive `README.md` explaining the example
3. Ensure the example is self-contained and includes all necessary files
4. Add the example to this README's list of examples

## Structure

Each example follows this basic structure:
```
examples/<example-name>/
├── README.md         # Documentation specific to the example
├── package.json      # Dependencies and scripts
└── src/             # Source code
    └── index.ts     # Entry point
```
