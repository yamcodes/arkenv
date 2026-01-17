---
change-id: add-deploy-rate-limiter
---

# Tasks: Deployment Rate Limiter

- [x] Create `.github/scripts/check-deploy-budget.cjs` with rate limiting and dry-run logic <!-- id: 0 -->
- [x] Add deployment budget check to `preview-www.yml` <!-- id: 1 -->
- [x] Add deployment budget check to `deploy-www.yml` <!-- id: 2 -->
- [x] Add rate limiter section to `CONTRIBUTING.md` <!-- id: 3 -->
- [x] Add `.github/deploy-metrics.json` to `.gitignore` <!-- id: 4 -->
- [x] Verify script logic with local unit tests (mocked dates) <!-- id: 5 -->
- [x] Verify GitHub Action logs to ensure `deploy-metrics.json` is updated and cached <!-- id: 6 -->
- [x] Verify preview deploy step is skipped when `should_deploy` is `false` <!-- id: 7 -->
