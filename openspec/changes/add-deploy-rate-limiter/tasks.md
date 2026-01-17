---
change-id: add-deploy-rate-limiter
---

# Tasks: Deployment Rate Limiter

1. - [x] Create `.github/scripts/check-deploy-budget.cjs` with rate limiting and dry-run logic <!-- id: 0 -->
2. - [x] Add deployment budget check to `preview-www.yml` <!-- id: 1 -->
3. - [x] Add deployment budget check to `deploy-www.yml` <!-- id: 2 -->
4. - [x] Add rate limiter section to `CONTRIBUTING.md` <!-- id: 3 -->
5. - [x] Add `.github/deploy-metrics.json` to `.gitignore` <!-- id: 4 -->
6. - [x] Verify script logic with local unit tests (mocked dates) <!-- id: 5 -->
7. - [x] Verify GitHub Action logs to ensure `deploy-metrics.json` is updated and cached <!-- id: 6 -->
8. - [x] Verify preview deploy step is skipped when `should_deploy` is `false` <!-- id: 7 -->
