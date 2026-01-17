---
change-id: add-deploy-rate-limiter
---

# Tasks: Deployment Rate Limiter

- [ ] Create `.github/scripts/check-deploy-budget.js` with rate limiting and dry-run logic <!-- id: 0 -->
- [ ] Add deployment budget check to `preview-www.yml` <!-- id: 1 -->
- [ ] Add deployment budget check to `deploy-www.yml` <!-- id: 2 -->
- [ ] Add rate limiter section to `CONTRIBUTING.md` <!-- id: 3 -->
- [ ] Add `.github/deploy-metrics.json` to `.gitignore` <!-- id: 4 -->
- [ ] Verify script logic with local unit tests (mocked dates) <!-- id: 5 -->
- [ ] Verify GitHub Action logs to ensure `deploy-metrics.json` is updated and cached <!-- id: 6 -->
- [ ] Verify preview deploy step is skipped when `should_deploy` is `false` <!-- id: 7 -->
