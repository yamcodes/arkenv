# Canons

Match these before inventing a new register. Clone turborepo.dev docs into
a gitignored folder when you need a live page, not memory.

## Outside reference

[Using AI with Turborepo](https://turborepo.dev/docs/guides/using-ai-with-turborepo)
is the positive example for an "Using AI with …" guide:

- Page lead (copy this cadence): two sentences, product name twice.
  "X is designed to work seamlessly with AI coding assistants. X
  provides features that help AI understand [your domain] and work
  more efficiently." No feature inventory in the lead.
- Each H2 defines the thing, then why it helps, then the command, then
  "The Skill teaches agents:" / "Descriptions help AI assistants:" bullets.
- Machine-readable docs explain *why* markdown exists (context window,
  version match), not only the URL.

Do not copy Turbo features ArkEnv does not have (worktrees, `turbo docs`,
versioned subdomains). Copy the **shape**.

## In-repo canons

Read at least two of these before a voice pass:

- `apps/www/content/docs/getting-started/index.mdx`
- `apps/www/content/docs/index.mdx` (Introduction)
- `apps/www/content/docs/getting-started/installation.mdx`
- `apps/www/content/docs/community.mdx`
- `apps/www/content/docs/frameworks/nextjs.mdx` (or Vite):
  `package-install` fences, authored as `npx` / `npm install`

Canonical docs live under `apps/www/content/docs/`.

## Mechanics vs register

`docs-writer` still owns relative links, wrapping, and "Next steps".
Callout *when* (forks, defaults) is this skill; the component is
fumadocs `<Callout>`, not Gemini GitHub alerts. If tone conflicts,
**the-voice** wins.
