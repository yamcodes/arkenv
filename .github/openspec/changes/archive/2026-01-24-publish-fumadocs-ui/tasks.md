# Tasks: publish-fumadocs-ui

## 1. Scaffold Package
- [ ] Create `packages/fumadocs-ui/package.json` with appropriate peer dependencies.
- [ ] Create `packages/fumadocs-ui/tsconfig.json`.

## 2. Infrastructure & Utilities
- [ ] Implement `src/utils/url.ts` (external link detection).
- [ ] Implement `src/utils/cn.ts` (Tailwind merge helper).
- [ ] Implement `src/styles/theme.css` with sharpened radius and header overrides.

## 3. Core Components
- [ ] Implement `src/components/ExternalLink.tsx` using `fumadocs-core/link`.
- [ ] Implement `src/components/Heading.tsx` with anchor icons and scroll margin.
- [ ] Implement `src/components/AIActions.tsx` (consolidating `LLMCopyButton` and `ViewOptions`).
- [ ] Implement `src/components/CodeBlock.tsx` (wrapping `fumadocs-ui/components/codeblock`).

## 4. MDX & Entry Points
- [ ] Create `src/mdx.tsx` with `arkenvComponents` mapping.
- [ ] Create `src/index.ts` to export all components.

## 5. Migration
- [ ] Install `@arkenv/fumadocs-ui` in `apps/www`.
- [ ] Repoint `apps/www/mdx-components.tsx` to use `arkenvComponents`.
- [ ] Import theme CSS in `apps/www/app/globals.css`.
- [ ] Clean up redundant components/utils in `apps/www`.

## 6. Validation
- [ ] Run `openspec validate publish-fumadocs-ui --strict`.
