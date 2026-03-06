## 1. Header Component

- [x] 1.1 Create `packages/fumadocs-ui/src/components/header.tsx` with `Header` component accepting `logo`, `links`, and `actions` props
- [x] 1.2 Implement scroll-aware styling via `useEffect` + `scrollY` listener: transparent background at top, `backdrop-blur` + semi-transparent background when scrolled (note: fumadocs `transparentMode` does not apply to custom `nav.component`)
- [x] 1.3 Apply fixed positioning and appropriate z-index to the `Header`; ensure rendered height equals `80px` to match the `--fd-nav-height` CSS variable already set in the fumadocs-ui CSS
- [x] 1.4 Style the layout: logo on the left, nav links in the center, actions on the right — matching the vite.dev aesthetic

## 2. Package Export

- [x] 2.1 Add `export * from "./header"` to `packages/fumadocs-ui/src/components/index.ts`
- [x] 2.2 Build the package (`pnpm build`) and verify `Header` appears in `dist/components/index.d.mts`

## 3. www App Integration

- [x] 3.1 Update `apps/www/app/(home)/layout.tsx` to import `Header` from `@arkenv/fumadocs-ui/components` and pass it via `nav: { component: <Header ... /> }` to `HomeLayout`
- [x] 3.2 Update `apps/www/app/docs/layout.tsx` to do the same for `DocsLayout`
- [x] 3.3 Remove nav options from `apps/www/app/layout.config.tsx` that are now owned by the `Header` component (nav links, theme toggle wiring if applicable)

## 4. Visual QA

- [x] 4.1 Verify the header renders correctly on the home page (transparent at top, blurred on scroll)
- [x] 4.2 Verify the header renders correctly on a docs page (fixed, above sidebar)
- [x] 4.3 Verify mobile layout does not regress
