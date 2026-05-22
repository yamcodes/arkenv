# Explicit Validator Mode

To support parsing environment variables with Standard Schema validators directly without requiring ArkType at runtime. We introduce an explicit `validator` mode config option (`"arktype"` | `"standard"`). When `"standard"` is selected, ArkEnv branches immediately to an ArkType-free path and does not load or import ArkType, allowing users to transition to ArkType gradually or use other schema libraries.

---

**Archived Specs**:

- [2026-01-17-add-explicit-validator-mode](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2026-01-17-add-explicit-validator-mode)
- [2026-01-21-bun-plugin-validator-mode](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2026-01-21-bun-plugin-validator-mode)
- [2026-01-21-vite-plugin-validator-mode](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2026-01-21-vite-plugin-validator-mode)
