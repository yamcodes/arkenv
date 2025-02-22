# @arkenv/vite-plugin

## 0.0.2

### Patch Changes

- Support `import.meta.env` environment variables _[`f1c2a02`](https://github.com/yamcodes/ark.env/commit/f1c2a02d2c754261f5cc14f99604d267e6df86db) [@yamcodes](https://github.com/yamcodes)_

  The plugin now supports Vite [Env Variables](https://vite.dev/guide/env-and-mode) out of the box.

  This means that by providing a schema, vite will check that the environment variables are valid on build time (or dev time, if you're using `vite` or `vite dev`).

## 0.0.1

### Patch Changes

- First release _[`#68`](https://github.com/yamcodes/ark.env/pull/68) [`0a89ed4`](https://github.com/yamcodes/ark.env/commit/0a89ed4af85677fc80690a84afd0077f11bf1508) [@yamcodes](https://github.com/yamcodes)_
