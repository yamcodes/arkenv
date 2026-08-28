# www Vitest and styled-jsx (Babel 7 vs 8)

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** shipped **C1 + C4 + B4** (#1679). www Vitest is Vite + Oxc `@vitejs/plugin-react` only. Public Next/Fumadocs mocks (or tests that never import that chrome) keep `styled-jsx` out of the graph. Playwright owns real Next CSS. Renovate [#1671](https://github.com/yamcodes/arkenv/pull/1671) stays a separate Babel 8 bump — do not bring `styled-jsx/babel` back to land it.

Trigger: `test (latest)` and `test (lts/*)` hung on `pnpm run test` after the lockfile rewired `@babel/core` 8.0.1 into `apps/www` Vitest (`@rolldown/plugin-babel` + `styled-jsx/babel`). Healthy `dev` jobs finish in \~2 minutes. Constraint from review: **no test warnings or errors**.

## Problem

When we are done:

1. Workspace Vitest (`pnpm test`) finishes in CI (no hang).
2. www jsdom tests stay silent (no unknown `jsx` prop on `<style>`, no Babel/plugin crashes).
3. We do not pretend CSS-in-JS is under test (`docs/TESTING.md`: behavior, not aesthetics).
4. Babel 8 is allowed **where nothing needs `styled-jsx/babel`**, without dragging www tests with it.

Not the problem: “should www components use styled-jsx?” They do not. The tax is Next (and friends) shipping styled-jsx into a **Vite** transform graph.

## Layer map

- **A — styled-jsx in www Vitest:** how (or whether) `<style jsx>` is compiled when Vite loads Next modules. Substitutes for each other.
- **B — `@babel/core` version policy:** 7 vs 8, repo-wide vs per-package. Substitutes for each other; composes with A (A1 cannot sit on B5).
- **C — www unit-test toolchain:** which compiler runs those tests. Substitutes for each other; a C pick can make A idle.

Items on different layers compose. Do not flatten into “Babel 8 vs remove the plugin.”

## Metrics

| Metric           | Question                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| Silence          | Do tests stay warning-free and error-free?                                     |
| Hang-proof       | Does `pnpm test` finish in CI in the usual \~2 minutes?                        |
| Honesty          | Are we compiling styles we do not assert, or lying that they exist?            |
| Simplicity       | Extra compilers, dual Babel, Next-in-Vite shims?                               |
| Upgrade path     | Can we take Babel 8 later without a second architecture fight?                 |
| Tax fairness     | Does www’s Next tax block the CLI playground’s React Compiler (Babel 8–ready)? |
| Footguns         | Will the next Renovate major hang CI again?                                    |
| Maintenance hell | SWC plugin drift, mocks vs Next exports, dual versions?                        |
| Already burned   | Did we already leave this path (#408 SWC)?                                     |

## The hat

### A — styled-jsx in www Vitest

| #  | Option                                                                             | Notes                                                          |
| -- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| A1 | `styled-jsx/babel` via `@rolldown/plugin-babel`                                    | Pre-#1679 (`apps/www/vitest.config.ts`). Babel 7 plugin. Left. |
| A2 | `styled-jsx/babel-test` (strip `jsx` attrs)                                        | Still a Babel 7 plugin. No CSS inject.                         |
| A3 | `@swc/plugin-styled-jsx` + `@vitejs/plugin-react-swc`                              | Left in #408 (unstable SWC / plugin-react-swc).                |
| A4 | SWC only for styled-jsx (unplugin-swc / `@swc/core`) without full plugin-react-swc | Not in tree. Same WASM plugin family as A3.                    |
| A5 | `vi.mock("styled-jsx")` / StyleRegistry stub in `tests/setup.ts`                   | No compiler. Breaks if Next’s export shape moves.              |
| A6 | No transform                                                                       | React warns: unknown `jsx` prop on `<style>`. User rejected.   |
| A7 | Next’s own test compiler (SWC) wrapping Vitest                                     | Vite is no longer the JSX pipeline.                            |
| A8 | Oxc / Rolldown native styled-jsx                                                   | Does not exist.                                                |
| A9 | Wait until `styled-jsx` supports Babel 8, then keep A1 on core 8                   | Time, not a patch today.                                       |

### B — `@babel/core` version policy

| #  | Option                                                                                                            | Notes                                 |
| -- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| B1 | Pin 7.x on every manifest that feeds www Vitest (today: `apps/www`, and anything else that rewires the same peer) | Direct answer to #1671.               |
| B2 | Allow 8 only where there is no `styled-jsx/babel` (e.g. `apps/playgrounds/arkenv-cli` + `reactCompilerPreset`)    | Split versions.                       |
| B3 | Dual: www 7, playground 8, explicit in lockfile                                                                   | Same as B2 with the split named.      |
| B4 | Remove `@babel/core` (and `@rolldown/plugin-babel`) from www if A is not Babel                                    | Follows A3–A7. Completes **C1 + A5**. |
| B5 | Merge #1671 as written (8.0.1 everywhere Renovate touched)                                                        | Hung CI. Out.                         |

### C — www unit-test toolchain

| #  | Option                                                 | Notes                                                                                                                                 |
| -- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| C1 | Vitest + Vite + `@vitejs/plugin-react`                 | Shipped. Idle A when C4 holds.                                                                                                        |
| C2 | Next experimental / official Vitest that uses Next SWC | Bigger migration.                                                                                                                     |
| C3 | Drop jsdom component tests; Playwright only            | E2E already covers routes and a11y.                                                                                                   |
| C4 | Mock `next/*` and Fumadocs so styled-jsx never loads   | Shipped. A idle. Existing tests already mock public Fumadocs / `next/navigation` / Sentry; remaining suites never import Next chrome. |

## Evaluation

**A1 `styled-jsx/babel`** — Silence: yes on Babel 7. Hang-proof: yes on 7, no on 8 (unsupported plugin + core 8). Honesty: compiles CSS nobody asserts; `tests/setup.ts` even swallows JSDOM stylesheet noise. Simplicity: one extra Rolldown Babel plugin, already in tree. Upgrade path: blocked on styled-jsx, not on `@rolldown/plugin-babel` (that package already takes core 8). Tax fairness: holds www (and anything that shares the peer) on 7. Footguns: Renovate major repeats the hang. Already burned: this *is* the post-#408 replacement for SWC.

**A2 `styled-jsx/babel-test`** — Silence: strips the prop, so no unknown-`jsx` warning, still Babel 7 so same hang on core 8. Honesty: worse than A1 (styles gone, still a Babel dep). Does not unlock B5.

**A3 SWC plugin + plugin-react-swc** — Hang-proof and silence if it works; no Babel 8 fight. Already burned: #408 left this for unstable compatibility. Maintenance hell: WASM plugin + Vite 8 Oxc plugin-react is a step backward.

**A4 SWC only for styled-jsx** — Same plugin family as A3 without necessarily dragging plugin-react-swc. Still SWC in a Vite 8 Oxc world. Simplicity and maintenance worse than A1. Not burned as a *narrow* SWC island, but close enough to A3 to distrust.

**A5 mock styled-jsx** — Silence if the mock matches Next’s exports. Hang-proof: no Babel. Honesty: styles never run (fine per TESTING.md). Footguns: silent wrong mock. Maintenance hell: Next/styled-jsx export churn.

**A6 no transform** — Fails Silence. Tests likely still pass. Rejected.

**A7 Next’s compiler** — Silence and hang-proof by using the same SWC Next uses in `next build`. Simplicity: new test runner contract. Upgrade path: Babel 8 becomes irrelevant for www tests. Cost is the migration, not the styled-jsx question.

**A8 Oxc native** — Vaporware. Score as “not an option today.”

**A9 wait for styled-jsx Babel 8** — Best long-term A1+B5. Not a close for #1671. Slot it; do not block on it.

**B1 pin 7.x** — Hang-proof and silence with A1. Footguns: add a Renovate ignore/allowedVersions or the PR comes back. Tax fairness: playground React Compiler stays on 7 too unless B2/B3. Simplest close.

**B2 / B3 split 7 vs 8** — Tax fairness: playground can take 8 (`reactCompilerPreset` does not need styled-jsx). Maintenance: two cores in one lockfile; easy to rewire the wrong peer again (exactly how #1671 hung www). Only worth it if the playground *needs* 8.

**B4 remove core from www** — Correct *after* A is not Babel. Alone it is A6.

**B5 merge #1671** — Fails Hang-proof. Fails Silence if the hang is “lucky” enough to error instead. Out.

**C1 Vitest + Vite** — Status quo. Forces an A pick. Matches the rest of the monorepo (`vitest.config.ts` `projects` includes `apps/*`).

**C2 Next test compiler** — Makes A idle. Large vs the current change (a Renovate major). A-tier later, not S now.

**C3 Playwright only** — Silence and hang-proof (no jsdom Next). Honesty: component tests go away. Conflicts with TESTING.md’s www unit/integration list. Too big for #1671.

**C4 mock Next/Fumadocs harder** — Idles A without dropping tests. Shipped: suites that would load Next/Fumadocs chrome mock public APIs; the rest never import that chrome. `tests/setup.ts` no longer swallows JSDOM stylesheet noise because compiled styled-jsx CSS is gone.

## Tier list

Solutions ranked as **answers to the whole problem**. Complete answers are **stacks**.

**S (chosen / default story)**

- **C1 + C4 + B4** — Keep www Vitest on Vite + Oxc `@vitejs/plugin-react`. Mock public `next/*` and Fumadocs APIs (or do not import that chrome) so styled-jsx never loads. Drop www’s `@babel/core`, `@rolldown/plugin-babel`, and test-only `styled-jsx`. Playwright owns real Next CSS.

**A**

- **A9** — When styled-jsx declares Babel 8, A1 could return. Not the www test strategy.
- **B2/B3** — Playground-only Babel 8 if React Compiler ever *requires* it. www no longer pins the repo to 7.
- **Revisit #1671** — After C4, www is not on the `styled-jsx/babel` graph. Still a separate PR; do not reintroduce A1 to merge it.
- **Renovate `allowedVersions` / ignore majors for `@babel/core`** — Optional if the playground still hangs on a core 8 major. Not required for [www](http://www).

**B**

- **C1 + A5 + B4** — Keep Vitest-on-Vite. Drop the Babel plugin. Mock `styled-jsx` so `<style jsx>` does not warn. Delete www’s `@babel/core` / `@rolldown/plugin-babel` (and `styled-jsx` if it is only there for tests). Not C4: Next/Fumadocs still render; only the CSS-in-JS compiler is stubbed. Scores Silence and Hang-proof if the mock covers Next’s exports; Honesty is fine (TESTING.md does not assert CSS). Loses to S on Footguns and Maintenance hell (export churn, a mock that is “quiet” but incomplete). Upgrade path and tax fairness beat S (www no longer pins the repo to Babel 7). A-tier is “optional later / do not ship to close #1671”; this stack is a real architecture change, so it sits in B, not A.
- **C4 + A5** — Stronger mock (Next/Fumadocs never load styled-jsx). Same B band, more mock surface than C1 + A5 + B4.

**C**

- **C1 + A1 + B1** — Pre-#1679 default. Compiles CSS nobody asserts; pins Babel 7; hung CI on #1671. Left.
- **C2** — Force Next’s full compile graph into jsdom. Only if we must render unmocked layouts in Vitest. Playwright covers that.
- **A4** — Narrow SWC island. Possible, still the family we left.

**D**

- **A3** — Full plugin-react-swc return. Already burned (#408).
- **C3** — Delete www jsdom tests. Wrong scope.

**E**

- **B5** — Merge #1671 as written.
- **A6** — Drop the plugin and live with warnings.
- **A8** — Oxc styled-jsx (does not exist).
- **A2 as a Babel 8 unlock** — Still Babel 7; does not help.

## S and A usage

### Use case 1: www jsdom tests (`pnpm test` → project `arkenv.js.org`)

**S:**

```ts
// apps/www/vitest.config.ts
import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [react()],
	// ...
});
```

Mock documented `next/*` / Fumadocs exports in the test that would otherwise load them (see `next/navigation` and `fumadocs-ui/contexts/search` in existing www tests). Do not `vi.mock("styled-jsx")`.

**A (revisit #1671):** www no longer lists `@babel/core`. A playground-only 8 bump is a different graph.

**Left (C1 + A1 + B1):** `styled-jsx/babel` on `@rolldown/plugin-babel` + `@babel/core` 7. Do not restore this to silence jsx-prop warnings.

### Use case 2: Renovate `@babel/core` major (#1671)

**S:** Do not merge *as a styled-jsx fix*. After C4, www is off that graph; treat #1671 as a playground/React Compiler bump and verify `pnpm test` before merge.

**A (stop the next Friday major if playground still hangs):**

```json
{
  "matchPackageNames": ["@babel/core"],
  "matchUpdateTypes": ["major"],
  "enabled": false
}
```

in `.github/renovate.json` `packageRules`, with a comment pointing at this note. Not required to close #1671.

### Use case 3: CLI playground React Compiler (`apps/playgrounds/arkenv-cli`)

**S:** Playground still has its own `@babel/core` 7 + `reactCompilerPreset()` + `@rolldown/plugin-babel`. That graph is not www Vitest. Do not edit playground files to close www’s styled-jsx work.

**A (B2/B3):** playground `package.json` on `@babel/core` 8 when Compiler or Rolldown Babel requires it. Verify `pnpm test` (www has no styled-jsx Babel plugin to rewire).

### Use case 4: Greenfield docs site (or “ready to change” this repo)

Not A5 (mock `styled-jsx` internals) and not A1 (invent a Babel pipeline for CSS you do not assert).

**Greenfield stack: C1 + C4 + B4** (A idle). Vitest + Vite + Oxc `@vitejs/plugin-react`. Mock **Next/Fumadocs public modules** (`next/link`, `next/navigation`, `next/image`, Fumadocs chrome) at the test boundary so styled-jsx never enters the graph. Drop `@babel/core`, `@rolldown/plugin-babel`, `styled-jsx/babel`. Playwright (`apps/playwright-www`) already owns real Next CSS, layouts, and a11y. If a jsdom test cannot survive without unmocked Fumadocs/Next chrome, **move that test to Playwright** — do not add a compiler or a `styled-jsx` mock.

Official Next Vitest setup is this shape ([Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)): `plugin-react` + jsdom + public `next/*` mocks. It is not a special Next SWC test runner. **C2** in this hat meant “buy Next’s full compile graph for jsdom.” Greenfield does not; E2E covers that. C2 stays C-tier (optional if we later insist on rendering unmocked layouts in jsdom).

**S (this repo, #1679):** C1 + C4 + B4. **Not S:** A5 (`vi.mock("styled-jsx")`), A1 (Babel compile), A3 (SWC).

## Current lean

Shipped **C1 + C4 + B4**. Do not restore `styled-jsx/babel` to quiet React. Do not mock styled-jsx internals (A5). Do not bring SWC back (A3). Playground Babel stays its own graph.

A-tier extras (Renovate ignore, wait for styled-jsx 8, merging #1671) stay optional and separate.

## Changelog of this note

- 2026-08-28: Shipped **C1 + C4 + B4** (#1679). S is no longer C1 + A1 + B1.
- 2026-08-28: Greenfield / ready-to-change story: **C1 + C4 + B4** (public Next mocks, no Babel, Playwright for real CSS). Not A5.
- 2026-08-28: Named **C1 + A5 + B4** (drop Babel, mock styled-jsx, remove www Babel deps) as B-tier, distinct from C4.
- 2026-08-28: First write-up (layers A/B/C, metrics, hat, tier list) after #1671 hung `pnpm test`.
