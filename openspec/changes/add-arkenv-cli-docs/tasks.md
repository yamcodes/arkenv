## 1. Documentation Setup

- [ ] 1.1 Create `README.md` in `packages/arkenv-cli` detailing usage and available options
- [ ] 1.2 Create `apps/www/content/docs/cli` directory if it doesn't exist

## 2. Fumadocs Integration

- [ ] 2.1 Create `apps/www/content/docs/cli/index.mdx` for the CLI documentation on the website
- [ ] 2.2 Update `apps/www/content/docs/meta.json` to include `"cli"` in the `pages` array, positioned adjacent to core plugins

## 3. Landing Page Updates

- [ ] 3.1 Modify `apps/www/app/(home)/page.tsx` to add `npx @arkenv/cli@latest init` next to the quickstart button
- [ ] 3.2 Ensure the command is styled appropriately (e.g., using a code block or stylized terminal component)
