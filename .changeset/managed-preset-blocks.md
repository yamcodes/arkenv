---
"arkenv": major
---

#### Support CLI managed preset blocks with apply, remove, and --preset flag

Added support for managed hosting preset comment blocks in `arkenv`, allowing safe addition, refreshing, and removal of provider presets without overwriting user-defined fields.

- The `arkenv preset apply <provider>` command safely injects or refreshes hosting presets within delimited `// @arkenv-preset-start <id>` / `// @arkenv-preset-end <id>` blocks (and role-suffixed blocks for strict layouts).
- The `arkenv preset remove <provider>` command removes preset blocks and updates `.env.example` while preserving keys shared with other presets.
- Added the `--preset, -P <provider>` option to `arkenv init` as the canonical flag.
- Added an `"arkenv": { "schema": "<path>", "layout": "flat" | "strict" }` configuration pointer to `package.json` on `init` for automatic schema discovery.
- Enforced fail-closed validation on key collisions against unmarked user fields or cross-preset blocks, as well as on malformed markers.
- Added clean git working tree checks before mutations (`--force` to bypass).

Usage:

```bash
# Apply or refresh a preset
npx arkenv@latest preset apply vercel

# Remove a preset
npx arkenv@latest preset remove vercel
```

**BREAKING CHANGE**: The `arkenv add host` command has been removed in favor of `arkenv preset apply <provider>`.

```diff
- npx arkenv add host vercel
+ npx arkenv preset apply vercel
```


