# ArkEnv examples

This directory contains a collection of example projects that demonstrate various use cases and features of ArkEnv. Each example is a standalone project that can be run independently.

## Examples

| Name                                                                                               | Description                                                                                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [basic](https://github.com/yamcodes/arkenv/tree/main/examples/basic)                               | Minimal example of *using ArkEnv in a [Node.js](https://nodejs.org/) app* for learning the fundamentals.                 |
| [with-nextjs](https://github.com/yamcodes/arkenv/tree/main/examples/with-nextjs)                   | Minimal example of *using ArkEnv in a [Next.js](https://nextjs.org/) app* (Simple layout).                               |
| [with-nextjs-strict](https://github.com/yamcodes/arkenv/tree/main/examples/with-nextjs-strict)     | Minimal example of *using ArkEnv in a [Next.js](https://nextjs.org/) app* (Strict split 3-file layout).                  |
| [with-nuxt](https://github.com/yamcodes/arkenv/tree/main/examples/with-nuxt)                       | Minimal example of *using ArkEnv in a [Nuxt](https://nuxt.com/) app*.                                                    |
| [with-vite-react](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react)           | Minimal example of *using ArkEnv in a [Vite](https://vite.dev/) + [React](https://react.dev/) app*.                      |
| [with-bun](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun)                         | Minimal example of *using ArkEnv in a [Bun](https://bun.sh/) app*.                                                       |
| [with-bun-react](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun-react)             | Minimal example of *using ArkEnv in a [Bun + React](https://bun.com/docs/guides/ecosystem/react) full-stack app*.        |
| [with-solid-start](https://github.com/yamcodes/arkenv/tree/main/examples/with-solid-start)         | Minimal example of *using ArkEnv in a [SolidStart](https://start.solidjs.com) app*.                                      |
| [with-zod](https://github.com/yamcodes/arkenv/tree/main/examples/with-zod)                         | Example of *using ArkEnv with [Zod](https://zod.dev/)* for validation (without ArkType).                                 |
| [with-standard-schema](https://github.com/yamcodes/arkenv/tree/main/examples/with-standard-schema) | Example of *mixing ArkType with [Standard Schema](https://standardschema.dev/) validators like [Zod](https://zod.dev/)*. |

> These examples are written in TypeScript, [the recommended way to work with ArkEnv](https://arkenv.js.org/docs/arkenv/quickstart#configure-typescript). That said, ArkEnv works with plain JavaScript. See the [basic-js](https://github.com/yamcodes/arkenv/tree/main/examples/basic-js) example for details and tradeoffs.

## Contributing an example

All examples are **synced from playgrounds** in `apps/playgrounds/`. Playgrounds use workspace dependencies (`workspace:*`) for testing new features, while examples use published versions for standalone use.

### Synced examples

All examples are automatically synced from their corresponding playgrounds.

Some examples of this mapping (not comprehensive):

| Example              | Playground                       |
| -------------------- | -------------------------------- |
| `basic`              | `apps/playgrounds/node`          |
| `basic-js`           | `apps/playgrounds/js`            |
| `with-bun`           | `apps/playgrounds/bun`           |
| `with-nextjs`        | `apps/playgrounds/nextjs`        |
| `with-nextjs-strict` | `apps/playgrounds/nextjs-strict` |
| `with-nuxt`          | `apps/playgrounds/nuxt`          |
| `with-bun-react`     | `apps/playgrounds/bun-react`     |
| `with-vite-react`    | `apps/playgrounds/vite`          |

To modify an example:

1. Make changes in the corresponding playground
2. Run `pnpm sync:examples` to update the examples
3. Commit both the playground and example changes

### Adding a new example

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

Each example follows this basic structure:

```
examples/with-<tool-1>-...<tool-n>/
├── README.md         # Documentation specific to the example
├── package.json      # Dependencies and scripts
└── src/             # Source code
    └── index.ts     # Entry point
```
