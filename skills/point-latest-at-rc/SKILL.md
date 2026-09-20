---
name: point-latest-at-rc
description: >-
  Point npm `latest` at the current `@rc` versions using local interactive
  npm auth (no GitHub `NPM_TOKEN`). Use when promoting RC to latest after
  publish, when CI promote_rc_to_latest 403s, when package Publishing access
  disallows tokens, or when the user asks to retag latest / run
  point-latest-at-rc without a CI token.
metadata:
  author: Yam Borodetsky
  version: 1.0.0
  internal: true
---

# Point npm `latest` at `@rc` (local / no CI token)

Maintainer alternative to the release workflow’s `NPM_TOKEN` path. Reuses
`scripts/point-latest-at-rc.js` with `--local` so `npm dist-tag` uses your
logged-in session (OTP OK). Trusted Publishing still covers **publish**;
this skill only covers **dist-tag**.

Do **not** remove or disable the CI promote job. Prefer CI when
`secrets.NPM_TOKEN` works; use this when it does not (or Yam chooses not
to fight token / Publishing-access settings).

## Preconditions

1. Repo root on a branch with `.changeset/pre.json` →
   `"mode": "pre"`, `"tag": "rc"` (same gate as CI).
2. Packages already published under `@rc` (e.g. `1.0.0-rc.1`).
3. npm user who can write dist-tags on `@arkenv/*` and `arkenv`
   (`npm login` if needed).

## Steps

```bash
# 1. Confirm auth
npm whoami

# 2. Optional dry-run (lists dist-tag commands; still resolves @rc)
node scripts/point-latest-at-rc.js --from-rc --dry-run

# 3. Retag (no NPM_TOKEN)
node scripts/point-latest-at-rc.js --from-rc --local
# or: pnpm point-latest-at-rc -- --from-rc --local
```

## Verify

```bash
npm view arkenv dist-tags
npm view @arkenv/core dist-tags
npm view @arkenv/agent-plugin dist-tags
```

Expect `latest` and `rc` both at the same `1.0.0-rc.n`.

## Smoke (after retag)

- Bare `npx arkenv init`
- `@arkenv/core` + arktype in a fresh Node app
- One framework example if time allows

## Failures

| Symptom | Likely cause |
| --- | --- |
| Soft-skip without `--local` | Missing `NPM_TOKEN` — add `--local` for this path |
| `Local mode requires npm auth` | Not logged in — `npm login` |
| `E403` on dist-tag | User lacks write on that package |
| Gate skip (`pre.json` / not `rc`) | Not in RC pre mode — do not force |

## Related

- Docs: `docs/RC_CHECKLIST.md` §C (CI + local alternatives)
- CI: `.github/workflows/release.yml` → `promote_rc_to_latest` (needs
  `NPM_TOKEN`; leave in place)
- Script help: `node scripts/point-latest-at-rc.js --help`
