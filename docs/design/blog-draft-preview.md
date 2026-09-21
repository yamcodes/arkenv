# Blog draft preview

Living evaluation, not an ADR. Update this file as options enter or leave
the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note for PR [#1907](https://github.com/yamcodes/arkenv/pull/1907).
**Chosen public story:** `A2 + B1 + C2` (implemented in `apps/www`).

## Field research (what others do)

Two different problems get conflated under “draft preview”:

| Content model | Best-practice pattern | Why |
| --- | --- | --- |
| **Git / MDX in repo** (ArkEnv) | Include drafts on **preview / branch deploys**; exclude on **production** | Content only changes when you push. Hugo’s `--buildDrafts` on Netlify `deploy-preview`, and dedicated “drafts on” preview channels, are the long-standing pattern. |
| **Headless CMS** (Sanity, Contentful, …) | Next.js / Vercel **Draft Mode** (secret → cookie → request-time fetch) | Content changes without a redeploy; you need ISR bypass + a preview API token. |

Sources worth anchoring on:

- [Next.js Draft Mode](https://nextjs.org/docs/app/guides/draft-mode) and
  [Vercel Draft Mode](https://vercel.com/docs/draft-mode) — CMS / ISR
  bypass, not “show MDX that was already in the build.”
- Hugo + Netlify: `--buildDrafts` only in `context.deploy-preview` (see
  community writeups on Netlify deploy contexts).
- [Astro content collections](https://docs.astro.build/en/guides/content-collections/):
  `import.meta.env.PROD ? !draft : true` — same local-only posture we have
  today; `astro preview` of a production build also hides drafts.
- Fumadocs (#1551): no built-in draft; maintainer suggested another git
  branch or **Vercel Flags** for gated access — not Draft Mode by default.

**Takeaway for ArkEnv:** you are not under-served by “special authenticated
links.” You are missing the git-blog default: **preview deployments should
show drafts**. Auth / secret links are an orthogonal bolt-on for when a
preview URL itself is too public.

## Problem

When we are done:

1. A draft post (`draft: true` in frontmatter) must **never** appear on
   production (`arkenv.js.org`) listing, RSS, or sitemap, and must 404 (or
   equivalent) on its public slug for anonymous visitors.
2. A maintainer must be able to open a **deployed** URL (not only
   `nub run www`) and read / share that draft for review.
3. Accidental indexing of drafts must stay hard (noindex on previews is
   already true for Vercel preview hosts).
4. The solution must fit MDX-in-git + Vercel previews. It must not invent
   a CMS workflow we do not have.

Today we only gate on `NODE_ENV === "development"`. Vercel preview and
production both run with `NODE_ENV=production`, so drafts vanish on every
deployed URL — including the PR preview you just opened.

## Layer map

- **Layer A — Visibility scope:** *where* drafts are allowed to render
  (substitutes).
- **Layer B — Access control:** *who* may see them once in scope
  (composes with A; often optional).
- **Layer C — Surface treatment:** how drafts appear in UI / feeds when
  allowed (composes with A/B).

Items on different layers compose. Do not flatten “auth vs preview env”
into one false choice.

## Metrics

| Metric | Question |
| ------ | -------- |
| **Fit to content model** | Does this match MDX-in-git (build-time), or is it solving CMS/ISR preview? |
| **Reviewer friction** | Can Yam (or a reviewer) open one URL and see the draft without ceremony? |
| **Leak surface** | How easily does a draft reach search indexes, RSS, or random visitors on production? |
| **Ops / secret tax** | New env vars, cookies, OAuth apps, Flags projects, Deployment Protection? |
| **Teachability** | Can CONTRIBUTING explain it in two sentences? |
| **Footguns** | Easy to leave a draft on production, ship a secret in a Referer log, or break static generation? |

## The hat

### Layer A — Visibility scope

| # | Option | Notes |
| - | ------ | ----- |
| A1 | Local `development` only (status quo) | `isPublishedBlogPage` + slug `notFound` on `NODE_ENV !== "development"`. |
| A2 | Local + Vercel **preview** (and optional `development`); production excludes | Gate on `VERCEL_ENV !== "production"` (and local when unset / `development`). Classic Hugo/Netlify preview-drafts. |
| A3 | Always build drafts; gate only at request time on every host including production | Needs Layer B. Useful for CMS; heavy for static MDX. |
| A4 | Separate always-on staging host that always builds drafts | Second project / branch deploy; permanent “drafts site.” |
| A5 | Temporarily set `draft: false` for review, then flip back | Process, not product. Easy to forget on merge. |
| A6 | Drafts live only on unmerged git branches; never `draft: true` in tree | Fuma’s “use another branch.” Listing still needs a filter if you merge early. |

### Layer B — Access control

| # | Option | Notes |
| - | ------ | ----- |
| B1 | No app gate — preview URL (+ robots noindex) is enough | Default for public OSS previews. |
| B2 | Shared secret → cookie (Next.js Draft Mode / `/api/draft?secret=`) | Industry standard for CMS; secret in query leaks via Referer until cookie is set. |
| B3 | Vercel Deployment Protection (password / Vercel SSO / GitHub) | Protects **whole** preview; zero app code. |
| B4 | App-level GitHub OAuth / session (“authenticated user”) | Real auth product. Overkill for a few MDX drafts. |
| B5 | Vercel Flags / feature flag unlock | What Fuma suggested; good for production gating, extra product surface. |
| B6 | Obscure-only: draft slugs work for anyone who knows the URL; omitted from index | Security through obscurity; still crawls if linked. |

### Layer C — Surface treatment

| # | Option | Notes |
| - | ------ | ----- |
| C1 | Allowed environments: same routes; drafts omitted from index/RSS/sitemap even there | Deep-link only. |
| C2 | Allowed environments: show in `/blog` with a clear **Draft** badge; still omit from production RSS/sitemap | Best for “did my preview include it?” |
| C3 | Separate `/drafts/…` or `/blog/draft/…` prefix | Extra routes; CMS-ish. |
| C4 | Production listing never; preview listing never; only direct slug | Easy to miss that the post exists. |

## Evaluation

**A1 Local only** — Fits a solo writer who never shares URLs. Fails metric
“reviewer friction” for Vercel previews (the pain we hit). Zero ops tax.
Footgun: people assume preview ≈ staging and get 404s.

**A2 Local + preview** — Best fit to MDX-in-git. Matches Hugo/Netlify
community practice. Reviewer friction is one preview URL. Leak surface on
production stays closed if production still filters. Ops tax: one predicate
change (`VERCEL_ENV` or `SHOW_BLOG_DRAFTS`), update tests. Teachability:
“Drafts show locally and on PR previews; never on production.” Footgun:
preview URLs are shareable — acceptable for OSS copy review; pair with B3
if a draft is sensitive. **Important:** Vercel preview still has
`NODE_ENV=production`; do **not** keep gating on `NODE_ENV` alone.

**A3 Always build + request gate** — Fit is poor without a CMS: MDX is
already in the bundle. You pay Layer B forever so production can
theoretically preview without a redeploy — which git already solves via
preview deploys. High ops tax.

**A4 Staging host** — Works (Jenkins “drafts site,” second Firebase
channel). Maintenance hell for one blog. Reject unless we want a permanent
marketing staging.

**A5 Flip `draft: false`** — Zero code. High forgetfulness footgun on
merge to `v1`. Fine as a one-off; bad as the system.

**A6 Branch only** — Works with A2 anyway. Alone it does not help if the
branch preview still strips drafts (today’s bug).

**B1 No gate** — Correct default for public framework blog drafts on
already-noindex preview hosts. Lowest friction.

**B2 Draft Mode secret** — Wrong primary tool for build-time MDX (Vercel
docs explicitly distinguish Draft Mode from preview deployments). Keep in
the hat for a future CMS. Secret-in-query is a known leak vector.

**B3 Deployment Protection** — Excellent optional A-tier when sharing
previews outside trusted people. No blog code. Does not by itself *include*
drafts in the build — still needs A2.

**B4 App OAuth** — Solves “authenticated user” literally. Highest tax,
least teachable for this repo. Overcomplicating.

**B5 Flags** — Reasonable if we later need production-gated docs drafts.
Extra moving part for a single blog.

**B6 Obscure slug** — Weak; crawlers and chat logs still find it. Do not
treat as access control.

**C1 Deep-link only** — Low discovery on preview (“where’s the post?”).
**C2 Draft badge** — Fixes that with clear labeling. **C3 Prefix** —
unnecessary indirection. **C4** — maximizes “I don’t see it” confusion.

### Close call: A2+B1 vs A2+B3

| | A2+B1 | A2+B3 |
| --- | --- | --- |
| Friction | Lowest | Login / password on every preview |
| Leak | Anyone with the preview URL | Only allowed Vercel/GitHub users |
| Tax | Code only | Vercel project setting |
| When | Public OSS blog review | NDA / unreleased product copy |

Ship A2+B1. Tuck B3 as optional ops, not app work.

## Tier list

Solutions ranked as answers to the whole problem. A complete answer is a
**stack** (one pick per layer).

**S (chosen / default story)**

- **`A2 + B1 + C2`** — Show drafts when not on Vercel production (local
  dev + preview / branch deploys). No app auth. List them on `/blog` with
  a Draft badge; keep production RSS/sitemap/listing clean.

**A**

- **`B3`** — Turn on Vercel Deployment Protection for previews if a draft
  must stay off the open internet. Orthogonal to A2; do not block the
  blog change on it.
- **`B5`** — Flags later if we need production-gated draft docs.

**B**

- **`A5`** — Manual `draft: false` for a hot review when you cannot wait
  for a code change.
- **`C1`** — Deep-link only if badges feel noisy (worse UX).

**C**

- **`A4`**, **`A6` alone**, **`B2` as primary**, **`C3`**

**D**

- **`A3 + B4`** — Authenticated production draft viewing for static MDX.
  Overcomplicating.

**E**

- **`B6`** as the only control — reject.

## S and A usage

### Use case 1: Review this TanStack blog on a Vercel preview

**S:**

```text
1. Keep draft: true in frontmatter.
2. Push the branch; open the Vercel preview /blog.
3. Post appears with a Draft badge; /blog/arkenv-tanstack-start renders.
4. Production /blog still omits it; production slug stays 404.
```

**A (B3):**

```text
Same as S, but the preview prompts for Vercel/GitHub auth before HTML.
```

### Use case 2: Local writing

**S:**

```text
nub run www → drafts visible (VERCEL_ENV unset / development).
No secret links required.
```

### Use case 3: Production must never list or feed drafts

**S:**

```ts
// apps/www/lib/blog-published.ts (sketch)
export function allowBlogDrafts(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // Local: no VERCEL_ENV. Preview/branch: "preview". Prod: "production".
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== "production";
  return env.NODE_ENV !== "production";
}

export function isPublishedBlogPage(page, env = process.env) {
  if (!page.data.draft) return true;
  return allowBlogDrafts(env);
}
```

```text
RSS + sitemap keep using getBlogPages() → still draft-free on production.
Slug page uses the same helper instead of raw NODE_ENV checks.
Optional: visible "Draft" chip in blog list/post header when page.data.draft.
```

**A:** unchanged; Deployment Protection is project config.

### Use case 4: Future CMS live preview (out of scope now)

**S:** not applicable — stay on A2.

**A / later:** B2 Draft Mode against a CMS preview API, not against MDX
files already in the deployment artifact.

## Current lean

**Shipped (S = `A2 + B1 + C2`):** `allowBlogDrafts` / `isPublishedBlogPage`
gate on `VERCEL_ENV` (preview includes drafts; production excludes). Local
`next dev` still shows drafts. `/blog` and post pages show a Draft badge
when `draft: true`. Draft posts send `robots: noindex` in metadata.

**Leave A-tier:** Vercel Deployment Protection if a preview must stay
off the open internet; Flags only if production-gated drafts become a
real requirement. Do **not** build OAuth or Draft Mode for MDX-in-git.

## Changelog of this note

- 2026-09-21: Implemented S (`VERCEL_ENV` gate + Draft badge + tests).
- 2026-09-20: First write-up (field research, layers A/B/C, metrics, hat,
  tier list, S = A2+B1+C2).
