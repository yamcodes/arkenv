---
change-id: add-deploy-rate-limiter
---

# Design: Deployment Rate Limiter

## Architecture

The rate limiter relies on GitHub Actions caching to persist a JSON file containing timestamps of recent deployments.

### State Management
State is stored in `.github/deploy-metrics.json`:
```json
{
  "preview": ["2026-01-17T15:54:31Z", ...],
  "prod": ["2026-01-17T15:50:00Z", ...]
}
```

### Rate Limiting Logic
The script `check-deploy-budget.js` will:
1. Load state from `.github/deploy-metrics.json` if it exists.
2. Prune timestamps older than 24 hours.
3. For `preview` type:
   - Check if total timestamps in 24h >= 76.
   - Check if the latest timestamp is < 20 minutes ago.
   - Output `should_deploy` flag for subsequent steps.
4. For `prod` type:
   - Always allow.
   - Count timestamps in 24h.
   - If count >= 24, exit 1 *after* deployment to trigger a workflow failure (alert).

### Persistence Strategy
We use `actions/cache` with:
- Key: `deploy-metrics-${{ github.run_id }}`
- Restore-keys: `deploy-metrics-`

This ensures we always get the most recent state and creates a new cache entry for every run, which is effectively "committing" the updated state.

## Trade-offs
- **Soft Limit**: It's a "soft" limit because GitHub Cache is eventually consistent and scoped to branches/refs. However, for a single PR or `main` branch, it should be sufficiently accurate.
- **Race coached**: Concurrent runs might overwrite each other's state if they finish at exactly the same time, but given the 20m cooldown and PR concurrency limits already in place, this is negligible.
