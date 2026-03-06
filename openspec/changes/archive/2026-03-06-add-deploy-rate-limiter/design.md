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
The script `check-deploy-budget.cjs` will:
1. Load state from `.github/deploy-metrics.json` if it exists.
2. Prune timestamps older than 24 hours.
3. For `preview` type:
   - Check if total timestamps in 24h >= 72.
   - Check if the latest timestamp is < 20 minutes ago.
   - Output `should_deploy` flag (true/false) and `reason` (limit|cooldown|ok).
4. For `prod` type:
   - Always allow.
   - Count timestamps in 24h.
   - If count >= 24, exit 1 *after* deployment to trigger a workflow failure (alert).

### Persistence Strategy
We use `actions/cache` with a single rolling key for deterministic restore/overwrite:
- Key: `deploy-metrics-v1`

This ensures we always restore a predictable state. While concurrent runs may still lead to a "last writer wins" scenario, it is much more deterministic than prefix-based restoration and aligns with our "soft limiter" philosophy.

### Scoping
Cache is scoped to the workflow and branch. PRs targeting the same branch share the same cache entry, which allows the rate limiter to track deployments across multiple contributors to the same context.

## Trade-offs
- **Soft Limit**: It's a "soft" limit because GitHub Cache is eventually consistent. However, for a single PR or `main` branch, it should be sufficiently accurate.
- **Race conditions**: Concurrent runs might overwrite each other's state if they finish at exactly the same time, but given the 20m cooldown and PR concurrency limits already in place, this is negligible.
