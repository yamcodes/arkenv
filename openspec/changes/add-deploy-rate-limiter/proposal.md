---
change-id: add-deploy-rate-limiter
title: Deployment Rate Limiter Implementation Plan
status: complete
---

# Proposal: Deployment Rate Limiter

## Problem
Vercel deployments, especially preview ones, can consume significant quota and resources if triggered too frequently (e.g., rapid pushes to a PR). We need a mechanism to soft-limit preview deployments and monitor production deployment rates to prevent accidental or malicious over-usage.

## Proposed Solution
Implement a soft rate limiter using a JSON state file (`.github/deploy-metrics.json`) persisted via GitHub Actions cache.

- **Preview Deploys**: 
  - Limit: 76 deploys per 24 hours.
  - Cooldown: 20 minutes between deploys.
  - Action: Skip deployment (exit 0, emit `should_deploy=false` and `reason`).
- **Production Deploys**:
  - Limit: Alert if >= 24 deploys per 24 hours.
  - Action: Always deploy, but fail the post-deploy check to alert if limit is exceeded (exit 1).

## Scope
- New script: `.github/scripts/check-deploy-budget.js`
- Modified workflows: `preview-www.yml`, `deploy-www.yml`
- Documentation: `CONTRIBUTING.md`
- State file: `.github/deploy-metrics.json` (gitignored, managed via GHA cache)

## Benefits
- Prevents quota exhaustion on Vercel.
- Provides visibility into deployment frequency.
- Maintainable without external databases.
