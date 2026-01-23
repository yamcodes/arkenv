# Proposal: publish-fumadocs-ui-theme

This proposal outlines the publishing of a Fumadocs UI theme and components into a standalone package `@arkenv/fumadocs-ui-theme`.

## Motivation
The custom styling, external link handling, and MDX enhancements developed for Bedstack (a different repository) are highly reusable. Centralizing them into a theme package, but exporting them as an ArkEnv theme allows for:
- Consistent branding across all ArkEnv-related documentation.
- Simplified maintenance of visual standards (e.g., sharpened corners, header offsets).
- Easier adoption of these refinements in other apps.

## Scope
- New package: `packages/fumadocs-ui-theme`.
- CSS Design System (Tailwind v4 based).
- Custom MDX Components (`Heading`, `ExternalLink`, `CodeBlock` wrappers).
- Shared utilities (`isExternalUrl`).
- Migration of `apps/www` to use the new package.

## Relationships
- This change introduces a new dependency for `apps/www`.
- It depends on `fumadocs-ui` and `tailwindcss`.
