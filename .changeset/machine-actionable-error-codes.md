---
"arkenv": minor
---

#### Add machine-actionable error codes to `init` JSON output

In `--json` / `--agent` mode, every deliberate safety-check refusal now emits a stable, documented error `code` alongside a `retryWith` hint, so agents no longer have to pattern-match on prose to decide how to escalate. Human-readable (non-JSON) output is unchanged.

- **`REQUIREMENTS_NOT_MET`** - a technical requirement failed. Includes per-requirement `details` with `current`/`expected`. `retryWith: ["--force"]`.
- **`GIT_TREE_DIRTY`** - the git working tree is not clean. `retryWith: ["--force"]`.
- **`NON_EMPTY_DIR`** - the target directory is not empty. `retryWith: ["--force"]`.
- **`INTERNAL`** - an unexpected failure (the CLI broke rather than refused). `retryWith: []`.

An empty `retryWith` means the refusal cannot be bypassed; a non-empty `retryWith` names the flag(s) to re-run with. Escalation pattern: run without `--force`, inspect `code`/`retryWith`, then retry deliberately.

Example refusal payload written to `stdout`:

```json
{
  "status": "error",
  "code": "GIT_TREE_DIRTY",
  "message": "Git working tree is not clean.",
  "retryWith": ["--force"]
}
```
