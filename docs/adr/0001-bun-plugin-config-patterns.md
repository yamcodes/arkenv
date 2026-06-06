# Bun plugin configuration patterns

To support build-time environment variable validation in Bun environments. The Bun plugin supports two primary configuration patterns:

1. **Direct Reference (`Bun.build`)**: Passing a configured plugin instance directly to the programmatic build API's `plugins` array.
2. **Package Reference (`Bun.serve`)**: Referencing `@arkenv/bun-plugin` as a string in `bunfig.toml`'s plugins list. In this mode, the plugin uses convention-based search to automatically discover and load the env schema file from well-known paths (e.g., `./src/env.ts`, `./env.ts`).

---

**Archived Specs**:

- [2025-11-28-add-bun-plugin](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2025-11-28-add-bun-plugin)
