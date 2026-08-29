---
name: the-voice
description: >
  Rewrite ArkEnv docs and site copy in the product voice: Turbo-shaped
  what/why/how, not skinny command lists and not marketing hype. Use when
  the user says "fix the voice", "/the-voice", "too skinny", "too terse",
  "needs meat", "match turborepo", or when writing, reviewing, or editing
  docs/MDX/homepage copy — even if they did not name this skill. Prefer
  this over docs-writer for register; keep docs-writer for links
  and wrapping. Use fumadocs `<Callout>` for forks and defaults.
metadata:
  author: Yam Borodetsky
  internal: true
---

# The voice

ArkEnv docs sound like [turborepo.dev](https://turborepo.dev/docs) plus
the pages already in that register: getting-started, Introduction,
Compatibility, Community, and a framework guide (for example Vite).
`docs-writer` is Gemini CLI boilerplate for mechanics. This skill is the
register. `stop-slop` cuts AI tells after the meat is in; it must not
strip why.

Read [references/canons.md](references/canons.md) before rewriting a
page. Read [references/examples.md](references/examples.md) when the
task is a voice pass (the AI guide is the worked example).

## What "fix the voice" means

Rewrite how the page sounds. Keep facts, IA, APIs, and deep-link
headings unless the user also asked to change those.

Each section needs **what**, **why**, and **how**. Skinny pages fail on
what/why ("do this, do that"). Inflated pages fail by dumping internals
(`marketplace.json`, diagnostic field lists) that belong in reference.

A good H2 starts in the reader's world, then what ArkEnv provides.
Do not open with "`@scope/pkg` is the [category noun]" unless the page
is API reference.

1. Name the ecosystem thing (plugins, skills) and what it is made of.
2. Say what ArkEnv provides and why.
3. Show the command or snippet.
4. Bullet what it teaches or enables, not only what it runs.

Pick a default path. Fallbacks are "instead," not "or also." Put that
fork in a fumadocs `<Callout>` (usually `type="info"` with a title),
not a body sentence. Match
`apps/www/content/docs/validating-your-environment/defining-your-schema.mdx`
(`title="Already on ArkType?"`). Use `warn` / `error` for risk, not
for navigation. Do not use GitHub `> [!NOTE]` alerts on the docs site.

The **page lead** is two sentences, product name in both, like Turbo:

> Turborepo is designed to work seamlessly with AI coding assistants.
> Turborepo provides features that help AI understand your repository
> and work more efficiently.

Do not open with commands, "It gives them…", or a feature list. Name
the outcome; let H2s name the features. Keep "seamlessly" in this
cadence. `stop-slop` must not flatten that lead.

## House terms

- **Typesafe** (one word), not "Type-safe".
- Headings and SEO: "environment variables". Body: "env vars" is fine.
- "Zero runtime dependencies" only for `@arkenv/core` (peer arktype) and
  `@arkenv/standard`. Never "zero dependencies" for the CLI or plugins.
- Nub is a real Node runner. Do not "correct" it to Bun.
- Address the reader as **you**. Present tense, contractions, US
  English. No "please", no Latin abbreviations in running copy, no
  anthropomorphism.

## Install fences

Commands the reader runs (`init`, `npm install`, `npx …`) use
fumadocs `package-install` fences, not `bash`. Author **npm** form only:
`npx …` or `npm install …`. Never `npm i`, `pnpm add`, `yarn add`, or
`bun add` in the source. The site tabs the other managers. See
`apps/www/content/docs/guides/frameworks/nextjs.mdx` and
`apps/www/lib/package-install-fences.test.ts`.

Leave `bash` for non-install shell (git, curl, file copies). Leave
`json` MCP configs as JSON even if a field is `"npx"`. Prompt fences
stay `text`.

## Not this voice

| Surface | Voice |
| --- | --- |
| `CHANGELOG.md` / changesets | User-facing past tense ("The plugin now…"), not imperatives |
| Boundary access errors | Next.js taint string; do not restyle |
| Hallmark / UI | Visual register, not docs prose |
| Prompts inside fenced `text` | Agent instructions; leave them tight |

## Workflow

1. Load the canons, then the target page.
2. Diagnose: skinny, stuffed, slop, or wrong surface.
3. Rewrite in the Turbo H2 shape. Add why with product facts, not
   filler. Do not invent features to add meat.
4. Point at reference for shapes, flags, and APIs.
5. Pass `stop-slop` without deleting the why bullets.
