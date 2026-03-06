## 1. Header Component

- [ ] 1.1 Create `packages/fumadocs-ui/src/components/header.tsx` with `Header` component accepting `logo`, `links`, and `actions` props
- [ ] 1.2 Implement scroll-aware styling: transparent background at top, `backdrop-blur` + semi-transparent background when scrolled
- [ ] 1.3 Apply fixed positioning and appropriate z-index to the `Header`
- [ ] 1.4 Style the layout: logo on the left, nav links in the center, actions on the right — matching the vite.dev aesthetic

## 2. Package Export

- [ ] 2.1 Add `export * from "./header"` to `packages/fumadocs-ui/src/components/index.ts`
- [ ] 2.2 Build the package (`pnpm build`) and verify `Header` appears in `dist/components/index.d.mts`

## 3. www App Integration

- [ ] 3.1 Update `apps/www/app/(home)/layout.tsx` to import `Header` from `@arkenv/fumadocs-ui/components` and pass it via `nav: { component: <Header ... /> }` to `HomeLayout`
- [ ] 3.2 Update `apps/www/app/docs/layout.tsx` to do the same for `DocsLayout`
- [ ] 3.3 Remove nav options from `apps/www/app/layout.config.tsx` that are now owned by the `Header` component (nav links, theme toggle wiring if applicable)

## 4. Visual QA

- [ ] 4.1 Verify the header renders correctly on the home page (transparent at top, blurred on scroll)
- [ ] 4.2 Verify the header renders correctly on a docs page (fixed, above sidebar)
- [ ] 4.3 Verify mobile layout does not regress
