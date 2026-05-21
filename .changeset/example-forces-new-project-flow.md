---
"@arkenv/cli": minor
---

#### `--example` now forces the new-project wizard regardless of the current directory

Previously, passing `--example` in a non-empty directory (or one that already has a
`package.json`) would silently fall through to the existing-project flow, ignoring the
flag entirely. The flag now always triggers the new-project wizard:

```sh
# Works even in a non-empty directory or one with package.json
arkenv init --example basic
```

**Special case – `arkenv init . --example basic`**: If you explicitly pass `.` as the
project name (or type it at the prompt) and the current directory is **not empty**, the
CLI aborts with a clear error instead of scaffolding into the dirty directory. When the
directory **is** empty, `.` is used for the current directory while the package name is
normalized to the current directory's basename as before.
