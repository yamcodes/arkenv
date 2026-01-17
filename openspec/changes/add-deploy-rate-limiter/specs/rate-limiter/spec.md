---
change-id: add-deploy-rate-limiter
capability: rate-limiter
---

# Spec: Deployment Rate Limiter

## ADDED Requirements

### Requirement: [rate-limiter.1] Budget Checking Script
The system MUST include a Node.js script that evaluates deployment budgets.
#### Scenario: Preview budget within limits
- PR pushes occur within 20m interval and under 76/day.
- SCRIPT outputs `should_deploy=true`.

#### Scenario: Preview budget exceeded (daily)
- 76 preview deploys have occurred in the last 24h.
- SCRIPT outputs `should_deploy=false` and logs remaining time.

#### Scenario: Preview budget exceeded (cooldown)
- A deploy occurred 5 minutes ago.
- SCRIPT outputs `should_deploy=false` and logs remaining time.

#### Scenario: Production alert threshold reached
- 24 production deploys have occurred in the last 24h.
- SCRIPT exit 1 when called with `prod` type after deployment.

### Requirement: [rate-limiter.2] Workflow Integration
The `preview-www.yml` and `deploy-www.yml` workflows MUST integrate the budget check.
#### Scenario: Gating Preview Deploys
- `preview-www.yml` calls the check script.
- The "Deploy" step is skipped if `should_deploy` is `false`.

#### Scenario: Alerting Production Deploys
- `deploy-www.yml` calls the check script after deployment.
- The workflow fails if the production threshold is exceeded.

### Requirement: [rate-limiter.3] Persistence via Cache
The deployment metrics MUST be persisted across runs using GitHub Actions cache.
#### Scenario: Cache restore
- The workflow restores `.github/deploy-metrics.json` using prefix `deploy-metrics-`.

#### Scenario: Cache save
- The workflow saves the updated `.github/deploy-metrics.json` using a unique run ID key.
