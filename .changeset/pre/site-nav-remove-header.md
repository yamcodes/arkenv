---
"@arkenv/fumadocs-ui": major
---

#### Remove `Header` from `@arkenv/fumadocs-ui`

Site-wide navigation chrome now lives in the www app as **Site Nav** (floating glass pill / docs bar). The package `Header` export is removed so a second nav implementation cannot drift from the site.

**BREAKING CHANGE**: `Header`, `HeaderLink`, and `HeaderProps` are no longer exported from `@arkenv/fumadocs-ui/components`. If you used them, replace with your own site chrome (ArkEnv www uses `apps/www/components/site-nav`).
