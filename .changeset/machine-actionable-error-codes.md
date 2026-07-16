---
"@arkenv/cli": patch
---

#### Emit machine-actionable error codes in `init` JSON output

Running `arkenv init --json` (or `--agent`) now tells you _why_ the CLI stopped, in a shape tools and AI agents can act on instead of scraping prose. Whenever a safety check refuses to proceed, the JSON written to `stdout` carries a stable `code` and a `retryWith` hint listing the flag(s) that would bypass the check. Human-readable (non-JSON) output is unchanged.

```json
{
  "status": "error",
  "code": "GIT_TREE_DIRTY",
  "message": "Git working tree is not clean.",
  "retryWith": ["--force"]
}
```

Codes:

- `REQUIREMENTS_NOT_MET` — a technical requirement (e.g. Node.js version) failed; `details.requirements` lists each failure with its `current`/`expected` values. `retryWith: ["--force"]`.
- `GIT_TREE_DIRTY` — the git working tree has uncommitted changes. `retryWith: ["--force"]`.
- `NON_EMPTY_DIR` — the target directory is not empty. `retryWith: ["--force"]`.
- `INTERNAL` — an unexpected failure (the CLI broke rather than refused). `retryWith: []`.

A non-empty `retryWith` names the flag(s) to re-run with; an empty array means the refusal can't be bypassed. Recommended flow: run without `--force`, inspect `code`/`retryWith`, then retry deliberately.

> **Note**: the terminal error payload now exposes `message` at the top level (next to `code`/`retryWith`); unexpected failures previously nested it under `details.message`. If you happened to parse the old error JSON, read the top-level `message` instead.
