## Context

The `@arkenv/cli` is a new package designed to quickly scaffold ArkEnv projects with various validation schemas (ArkType, Zod, Valibot). It utilizes an interactive CLI prompt to guide users through the setup process. We need to document its capabilities so that developers can easily adopt it in their own projects. The documentation will reside in two places:
1. `packages/arkenv-cli/README.md` for npm registry and GitHub context.
2. `apps/www/content/docs/cli` for the official documentation site.

## Goals / Non-Goals

**Goals:**
- Provide clear instructions on how to use `pnx @arkenv/cli@latest init`.
- Add the `npx @arkenv/cli@latest init` command to the landing page for immediate visibility.
- Explain the interactive prompts and supported validation libraries.
- Integrate the CLI docs seamlessly into the existing Fumadocs documentation site in `apps/www`, placing it alongside other core packages in the sidebar.

**Non-Goals:**
- Do not document the internal architecture of `@arkenv/cli` here; focus strictly on end-user usage.
- Do not redesign the entire documentation site.

## Decisions

- **CLI Docs Location**: We will create a new directory at `apps/www/content/docs/cli` with an `index.mdx` file. This provides a clean URL path (`/docs/cli`).
- **NPM Package README**: We will add a focused `README.md` to `packages/arkenv-cli` that serves as a quickstart, referring back to the main website for detailed guides.
- **Landing Page Update**: We will modify `apps/www/app/(home)/page.tsx` to display the `@arkenv/cli` init command next to the quickstart button, using a stylized code snippet component.
- **Fumadocs Integration**: We will update `apps/www/content/docs/meta.json` to include `"cli"` in the `pages` array, ensuring it shows up in the site's sidebar navigation adjacent to `arkenv`, `vite-plugin`, and `bun-plugin`.

## Risks / Trade-offs

- **Risk**: Information duplication between `README.md` and the website docs.
  - *Mitigation*: The `README.md` will be kept concise (installation + basic usage), while the website docs will contain the full depth of information (advanced usage, integrations).
