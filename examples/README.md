# ArkEnv examples

This directory contains a collection of example projects that demonstrate various use cases and features of ArkEnv. Each example is a standalone project that can be run independently.

> [!NOTE]
> The examples listed below are written in TypeScript out of convention.
> ArkEnv does _not_ require TypeScript. If you prefer plain JavaScript, see [basic-js](https://github.com/yamcodes/arkenv/tree/main/examples/basic-js) for a basic example.

## Examples

| Name                                                                                             | Description                                                                                              |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`basic`](https://github.com/yamcodes/arkenv/tree/main/examples/basic)                           | Minimal example of *using ArkEnv in a [Node.js](https://nodejs.org/) app* for learning the fundamentals. |
| [`with-bun`](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun)                     | Minimal example of *using ArkEnv in a [Bun](https://bun.sh/) app*.                                       |
| [`with-bun-react`](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun-react)         | Minimal example of *using ArkEnv in a [Bun+React](https://bun.com/docs/guides/ecosystem/react) full-stack app*.                                       |
| [`with-vite-react`](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react) | Minimal example of *using ArkEnv in a [Vite](https://vite.dev/)+[React](https://react.dev/) app*.                                    |

## Contributing an example

Some examples are **synced from playgrounds** in `apps/playgrounds/`. Playgrounds use workspace dependencies (`workspace:*`) for testing new features, while examples use published versions for standalone use.

### Synced examples

The following examples are automatically synced from their corresponding playgrounds:

| Example | Playground |
|---------|------------|
| `with-bun` | `apps/playgrounds/bun` |
| `with-bun-react` | `apps/playgrounds/bun-react` |
| `with-vite-react` | `apps/playgrounds/vite` |

To modify a synced example:

1. Make changes in the corresponding playground
2. Run `pnpm sync:examples` to update the examples
3. Commit both the playground and example changes

### Adding a new synced example

1. Create a new playground under `apps/playgrounds/`
2. Add `arkenvExamples` metadata to the playground's `package.json`:
   ```json
   {
     "arkenvExamples": [
       {
         "name": "with-my-tool",
         "packageManager": "npm"
       }
     ]
   }
   ```
3. Run `pnpm sync:examples` to generate the example
4. Add the example to this README's list

### Manually maintained examples

The following examples are manually maintained (not synced from playgrounds):

- `basic` - Beginner-friendly Node.js example
- `basic-js` - JavaScript variant of the basic example

Each example follows this basic structure:
```
examples/with-<tool-1>-...<tool-n>/
├── README.md         # Documentation specific to the example
├── package.json      # Dependencies and scripts
└── src/             # Source code
    └── index.ts     # Entry point
```
