---
"arkenv": major
---

#### Replace `--json` payloads with settlement envelopes

`--json` / `--agent` now write an `ok`-discriminated settlement document to stdout instead of `{ status, code, message, retryWith }`. Human-readable output is unchanged. JSON stays on stdout; logs stay on stderr. Secret values are redacted in `meta`, `summary`, and `why`.

Completed runs use `ok: true` (including `arkenv check` findings, which still set `exitCode: 4`). Aborts use `ok: false` with a dotted `CLI.*` or `ENV.*` code. `nextActions` is always present (`[]` when there is nothing to do). Commands in `nextActions` resolve to the invoked runner (`pnpm arkenv`, `npx arkenv`, `bunx arkenv`, and so on).

Example refusal:

```json
{
  "ok": false,
  "commandId": "init",
  "error": {
    "code": "CLI.GIT_TREE_DIRTY",
    "severity": "error",
    "summary": "Git working tree is not clean.",
    "nextActions": [
      {
        "kind": "run-command",
        "label": "Re-run with --force to bypass this check",
        "command": "npx arkenv init --force"
      }
    ]
  },
  "diagnostics": [],
  "nextActions": [
    {
      "kind": "run-command",
      "label": "Re-run with --force to bypass this check",
      "command": "npx arkenv init --force"
    }
  ]
}
```

**BREAKING CHANGE**: Agents must switch from `status` / `retryWith` to `ok` / `error.code` / `nextActions`. Flat codes such as `GIT_TREE_DIRTY` are now dotted (`CLI.GIT_TREE_DIRTY`).

```diff
- { "status": "error", "code": "GIT_TREE_DIRTY", "retryWith": ["--force"] }
+ { "ok": false, "error": { "code": "CLI.GIT_TREE_DIRTY", "nextActions": [{ "kind": "run-command", "command": "npx arkenv init --force" }] } }
```
