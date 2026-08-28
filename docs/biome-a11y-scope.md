# Biome a11y vs Playwright axe

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note for Renovate PR [#1657](https://github.com/yamcodes/arkenv/pull/1657). **Chosen public story:** keep Playwright axe as the www WCAG gate; keep Biome a11y on `apps/www`; turn Biome a11y off for playgrounds, examples, and the create-skill eval viewer so Biome 2.5 can land.

Trigger: `autofix.ci` on #1657 fails `biome check --write` after `@biomejs/biome` `2.4.14` → `2.5.10`. Ten **errors** (not warnings): `noSvgWithoutTitle` on playground SVGs, `noAmbiguousAnchorText` on a scaffold “Learn more” link, `noStaticElementInteractions` / `useKeyWithClickEvents` on `skills/create-skill/eval-viewer/viewer.html`. `www` is not in that list. Product a11y for the docs site is already axe in `apps/playwright-www` (`assertNoA11yViolations`, WCAG 2 A/AA).

## Problem

When we are done:

1. `#1657` can take Biome 2.5 without `autofix.ci` failing on fixture HTML/SVG.
2. `arkenv.js.org` still has a CI WCAG gate (axe on real routes).
3. Biome a11y still nags **product** UI (`apps/www`) while people type.
4. We do not call a lint pass on Vite logos “the a11y test.”

Not the problem: “should documentation pages be accessible?” Yes. That is Playwright, not whether `react.svg` has a `<title>`.

## Layer map

- **A — product WCAG gate:** what CI uses to fail a docs-site a11y regression. Substitutes for each other.
- **B — Biome a11y scope:** which trees the static `lint/a11y/*` rules apply to. Substitutes for each other; composes with A (turning Biome off on playgrounds does not remove axe).
- **C — how #1657 takes Biome 2.5:** pin, override, fix files, or split the Renovate group. Substitutes for each other; a C pick must match a B pick (C1 needs no B change; C2 needs a B other than B1).

Items on different layers compose. Do not flatten into “turn a11y off vs keep testing a11y.”

## Metrics

| Metric           | Question                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| Honesty          | Do we treat lint on fixtures as the WCAG suite?                            |
| Product coverage | Does a real docs-route regression still fail CI?                           |
| Cheap catch      | Do authors of `apps/www` still get a11y lint before a Playwright run?      |
| Tax fairness     | Can a Vite default SVG block the whole pnpm group?                         |
| Footguns         | Will the next Biome minor light up another scaffold file?                  |
| Simplicity       | Pin forever vs one override vs editing generated logos?                    |
| Teachability     | Can someone edit a playground without learning WCAG for clip-path sprites? |
| Maintenance hell | Ignore sprawl, per-file `biome-ignore`, or a forever 2.4 pin?              |

## The hat

### A — product WCAG gate

| #  | Option                                   | Notes                                                                                  |
| -- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| A1 | Playwright + axe on www routes           | Current (`apps/playwright-www/tests/utils/a11y.ts`, smoke routes).                     |
| A2 | Axe **and** Biome a11y on `apps/www`     | Current for www: Biome `recommended` already includes a11y; axe is extra.              |
| A3 | Drop axe; Biome a11y only                | Out of scope for #1657. Loses runtime DOM, Fumadocs chrome, contrast in the real tree. |
| A4 | Neither                                  | Rejected. Docs site would have no CI WCAG gate.                                        |
| A5 | Axe only; Biome `a11y: off` at repo root | Removes the cheap catch on www.                                                        |

### B — Biome a11y scope

| #  | Option                                                                | Notes                                                                                     |
| -- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| B1 | Keep a11y on for the whole includes glob                              | Status quo. Breaks `autofix.ci` on 2.5.                                                   |
| B2 | Off only for `**/*.svg`                                               | Misses `app.tsx` “Learn more” and `viewer.html`.                                          |
| B3 | Off for `**/playgrounds/**` and `**/examples/**` only                 | Matches the existing `noConsole` override glob. Misses `skills/create-skill/eval-viewer`. |
| B4 | B3 plus `skills/create-skill/eval-viewer/**`                          | Covers every 2.5 error on #1657.                                                          |
| B5 | `a11y: off` under root `linter.rules`                                 | Also silences `apps/www`.                                                                 |
| B6 | Drop those paths from `files.includes`                                | Stops format + other lints too (tabs, unused vars).                                       |
| B7 | Fix the files (titles, `aria-hidden`, link text, `button` + keyboard) | Honest for first-party HTML; tax on Vite-generated SVGs that regenerate.                  |
| B8 | `biome-ignore` at the top of each failing file                        | Survives 2.5; spreads; next new SVG needs another comment.                                |

### C — how #1657 takes Biome 2.5

| #  | Option                                            | Notes                                                                                                                         |
| -- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| C1 | Pin `@biomejs/biome` at `2.4.14`                  | No `biome.jsonc` policy. Repeat fight on 2.6.                                                                                 |
| C2 | Take `2.5.10` + a B override (not B1)             | Policy in the same repo file that already relaxes playgrounds.                                                                |
| C3 | Take `2.5.10` + B7 (edit fixtures)                | No override. Churn on logos.                                                                                                  |
| C4 | Split Biome out of the pnpm group; merge the rest | Unblocks Fumadocs after [#1682](https://github.com/yamcodes/arkenv/pull/1682); leaves autofix red if Biome still bumps later. |
| C5 | Keep 2.5; set the new rules to `warn` globally    | `autofix.ci` / `check:errors` may pass; `pnpm check` still noisy; www cheap-catch becomes warn.                               |
| C6 | Change `scripts/fix.js` to ignore a11y            | Autofix green, `pnpm check` still red. Lies about “fixed.”                                                                    |

## Evaluation

**A1 Playwright axe** — Honesty: this *is* the suite (`docs/TESTING.md` user-journey + a11y). Product coverage: yes, real routes, impact-gated. Cheap catch: none at type time. Tax fairness: n/a (does not see playground SVGs). Footguns: Fumadocs exclusions already in `a11y.ts`. Simplicity: already shipped. Teachability: contributors follow Playwright, not Biome, for “did we ship WCAG.” Maintenance: axe + allowed lists, already paid.

**A2 Axe and Biome on www** — Honesty: two tools, two jobs (lint vs runtime). Product coverage: axe remains the fail-closed gate. Cheap catch: yes on www TSX. Tax fairness: does not require playgrounds to pass Biome a11y. This is the current www story if B is not B5.

**A3 Drop axe** — Honesty: Biome cannot see computed contrast, dialogs, or Fumadocs chrome. Product coverage: fails the problem statement. Footguns: a green `biome check` with a broken sidebar. Maintenance hell: we would rediscover this the first time a “Learn more” in www slips through.

**A4 Neither** — Product coverage: no. Rejected.

**A5 Root `a11y: off`** — Honesty: “Biome is not the test” used as an excuse to drop lint on the product. Cheap catch: gone. Simplicity: one line. Tax fairness: playgrounds stop blocking. Footguns: www click-only `div`s wait for Playwright. Worse than a scoped override.

**B1 Whole-repo a11y** — Honesty: pretends clip-path sprites are product UI. Tax fairness: #1657 hostage. Footguns: every Biome a11y promotion. Teachability: bad (scaffold noise). Matches “we test a11y” only if you confuse lint with axe.

**B2 SVG-only** — Simplicity: one glob. Incomplete: #1657 still fails on `app.tsx` and `viewer.html`. Footguns: next HTML fixture.

**B3 Playgrounds + examples** — Honesty: same trees we already relax (`noConsole`). Misses eval-viewer (skills, not playground). Incomplete for this PR.

**B4 Playgrounds + examples + eval-viewer** — Honesty: lint off where axe never runs. Product coverage: www unchanged. Cheap catch: www kept. Tax fairness: pnpm group unblocked. Footguns: a *new* tree outside those globs can still fail autofix (pay then, same as today). Simplicity: one more `includes` on the existing override, plus a small override for the viewer. Teachability: “fixtures are not www.” Maintenance: two globs, not N `biome-ignore`s.

**B5 Root off** — See A5. Scores well on tax fairness, poorly on cheap catch and honesty if we still say “we lint a11y.”

**B6 Exclude from `files.includes`** — Stops formatter too. Playgrounds would drift from tab/quote rules. Maintenance hell: two style worlds.

**B7 Fix the files** — Honesty: high for `viewer.html` we own. Tax fairness: low for `public/icons.svg` copied from a template. Footguns: `arkenv init` / example sync may rewrite logos. Simplicity: no policy. Maintenance: patch fixtures forever.

**B8 Per-file ignore** — Honesty: admits “this file is exempt.” Maintenance hell: every new SVG. Teachability: people copy the ignore. Worse than B4.

**C1 Pin 2.4.14** — Simplicity: Renovate `allowedVersions`. Tax fairness: rest of #1657 can merge if Biome is grouped (may still need a split). Footguns: 2.6 repeats. Maintenance: pin rot. Honest if we refuse a policy change this week.

**C2 2.5 + B override** — Matches B4. One `biome.jsonc` change, take the bump. Footguns: next rule promotion in **www** still fails CI (wanted).

**C3 2.5 + B7** — No override. Pays the SVG tax. Weak on tax fairness.

**C4 Split the group** — Unblocks Fumadocs/Nuxt/Vite without deciding B. Leaves a Biome-only PR. Honesty: kicks the hat down the road. Fine as a *sequence*, not as the answer to this problem.

**C5 Warn globally** — `check:errors` / autofix might go green; `pnpm check` still dumps 10 errors-as-warnings mix. Cheap catch on www becomes easy to ignore. Weak honesty.

**C6 Autofix ignores a11y** — Autofix green, `pnpm check` red. Lies. Rejected.

## Tier list

Solutions ranked as **answers to the whole problem**. Complete answers are **stacks**.

**S (chosen / default story)**

- **A1 + A2 + B4 + C2** — Axe stays the www WCAG gate. Biome a11y stays on for `apps/www` (A2). Override `a11y: off` for `**/examples/**`, `**/playgrounds/**`, and `skills/create-skill/eval-viewer/**`. Take Biome 2.5.10 on #1657 (after [#1682](https://github.com/yamcodes/arkenv/pull/1682) for Fumadocs `$ref`).

**A**

- **C1** — Pin Biome 2.4.14 if we do not want a `biome.jsonc` policy in the same week as the Fumadocs bump. Optional delay, not the story.
- **B7 on `viewer.html` only** — If someone is already in that file. Do not block #1657 on SVG titles.

**B**

- **C4** — Split Biome out of the pnpm group to land Fumadocs first. Sequence, not a policy.
- **B3** — Almost S; still need the eval-viewer glob.

**C**

- **B2** — Incomplete.
- **C3 / B7 for all logos** — Honest, expensive, regenerates.
- **B8** — Ignore comments forever.

**D**

- **C5** — Warn-away.
- **C1 as the long-term policy** — Pin rot.

**E**

- **A3, A4, A5, B1 (with 2.5), B5, B6, C6** — Drop axe, drop all gates, whole-repo lint hostage, root `a11y: off`, exclude from Biome entirely, or make autofix lie.

## S and A usage

### Use case 1: `autofix.ci` / `pnpm check` after Biome 2.5

**S:**

```jsonc
{
  "includes": ["**/examples/**/*", "**/playgrounds/**/*"],
  "linter": {
    "rules": {
      "a11y": "off",
      "suspicious": { "noConsole": "off" },
      "style": { "noNonNullAssertion": "off" }
    }
  }
}
```

Second override: `"includes": ["skills/create-skill/eval-viewer/**"]` with `"a11y": "off"`. Root `linter.rules` unchanged (www still recommended a11y).

**A:** Renovate `allowedVersions` / pin `"@biomejs/biome": "2.4.14"` until the override lands on `dev`, then take 2.5.

### Use case 2: Docs-site WCAG regression (missing name on a www control)

**S:** Playwright smoke + `assertNoA11yViolations` fails. Biome may also fail on the www TSX if the issue is static (no `alt`). Playground override does not apply.

**A:** Same axe gate if Biome is still pinned; no change to Playwright.

### Use case 3: Author edits `apps/playgrounds/vite/src/app.tsx`

**S:** No Biome a11y errors. Console allowed (existing). If that UI ever mattered as product, it would need its own axe job; it does not today.

**A:** Pin 2.4: they still see 2.4 a11y on that file (today those were not errors). Weaker story.

### Use case 4: Author edits `apps/www/components/...`

**S:** Biome a11y still errors. Axe still scans routes. Scoped override does not apply.

**A:** Pin: same www lint as 2.4.

### Use case 5: Merge #1657 after #1682

**S:** Fumadocs `$ref` crash gone (#1682). Biome 2.5 + B4 override. Do not wait on SVG titles (B7).

**A:** Merge #1657 with Biome pinned, follow-up PR for B4 + bump. Extra round-trip.

## Current lean

Shipped **A1 + A2 + B4 + C2**. www `public/assets/icon.svg` keeps a11y and got a `<title>` (product asset, not a playground logo). Do not set root `a11y: off`. [#1657](https://github.com/yamcodes/arkenv/pull/1657) can rebase for Fumadocs after [#1682](https://github.com/yamcodes/arkenv/pull/1682); Biome autofix should be clear once this lands.

Stay a living note for now (not an ADR). The override is one `biome.jsonc` edit to reverse; promote only if the policy hardens beyond that.

## Changelog of this note

- 2026-08-28: Keep living note (not ADR); fix autofix mangling of bare `www` into dead links.
- 2026-08-28: Shipped **B4 + C2** (`biome.jsonc` overrides + `@biomejs/biome` 2.5.10) and titled www `icon.svg`.
- 2026-08-28: First write-up (layers A/B/C, metrics, hat, tier list) after #1657 `autofix.ci` vs Biome 2.5 a11y.
