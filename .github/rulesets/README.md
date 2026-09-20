# Repository rulesets

Canonical desired state for repository rulesets lives here. Apply changes
through the **rulesets** workflow — never edit live rulesets in the GitHub
UI as the long-term source of truth.

## Files

| File | Purpose |
| --- | --- |
| `default-branch.json` | Ruleset that targets `~DEFAULT_BRANCH` (required status checks, squash-only PRs, deletion / non-fast-forward protection). |

Required check contexts must match the concrete job names emitted by
`.github/workflows/test.yml` (exact string match). When you change the Node
matrix there, update `default-branch.json` in the same PR.

## Maintainer setup (one-time)

Before a non-dry-run apply can succeed:

1. Create a dedicated GitHub App named **`arkenv-infra`** with
   **Administration: Read and write** and **Metadata: Read** only. Install it
   on this repository. Do not reuse the day-to-day bot App credentials.
2. Add repository variables / secrets (distinct from `APP_ID` /
   `APP_PRIVATE_KEY`):
   - Variable `INFRA_APP_ID` — App client id
   - Secret `INFRA_APP_PRIVATE_KEY` — App private key
3. Create a GitHub Environment named **`rulesets`** and require reviewer
   approval before deployments.

## Apply

Both dry-run and apply run through the protected `rulesets` environment, so
every workflow dispatch waits for reviewer approval.

1. Open **Actions → rulesets → Run workflow**.
2. Leave **dry_run** enabled (default) to print the live-vs-committed diff.
3. Run again with **dry_run** disabled to `PUT` the committed body.

`default-branch.json` intentionally omits `bypass_actors`. Omitting that field
on `PUT` leaves existing bypass actors unchanged (send `"bypass_actors": []`
only if you mean to clear them). Bypass actors stay UI-managed.

Break-glass (local, with an admin token that can manage rulesets). The list
endpoint has no `conditions`, so resolve by name first, then fall back to the
detail endpoint for `~DEFAULT_BRANCH`:

```sh
RULESET_ID=$(gh api repos/yamcodes/arkenv/rulesets \
  --jq '.[] | select(.name=="default-branch") | .id')
if [[ -z "$RULESET_ID" ]]; then
  while IFS= read -r id; do
    if gh api "repos/yamcodes/arkenv/rulesets/${id}" | jq -e \
      '.conditions.ref_name.include | index("~DEFAULT_BRANCH")' \
      >/dev/null; then
      RULESET_ID=$id
      break
    fi
  done < <(gh api repos/yamcodes/arkenv/rulesets --jq '.[].id')
fi
gh api --method PUT "repos/yamcodes/arkenv/rulesets/${RULESET_ID}" \
  --input .github/rulesets/default-branch.json
```
