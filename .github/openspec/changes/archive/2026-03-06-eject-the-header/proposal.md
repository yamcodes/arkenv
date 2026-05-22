## Why

The www app's header is tightly coupled to the app itself, making it impossible to reuse across other surfaces. Ejecting it into `@arkenv/fumadocs-ui` creates a shared, design-system-compliant header component that any arkenv app can consume — and gives us a place to build a polished, vite.dev-style nav.

## What Changes

- A new `Header` component is added to `@arkenv/fumadocs-ui` that renders an opinionated site header (logo, nav links, theme toggle, GitHub icon) similar in style to the vite.dev navbar
- The www app's home and docs layouts are updated to consume the new `Header` component from `@arkenv/fumadocs-ui` instead of relying on fumadocs-ui's built-in navbar wiring via `layout.config.tsx`
- The www app's `layout.config.tsx` nav configuration is simplified or removed as the header takes over that responsibility
- The `@arkenv/fumadocs-ui` package exports the `Header` component from its `components` entry point

## Capabilities

### New Capabilities

- `header`: A standalone `Header` React component in `@arkenv/fumadocs-ui` that renders the ArkEnv site header — logo, navigation links, GitHub icon, theme toggle — styled to match the vite.dev aesthetic (transparent background, blur on scroll, clean link styling)

### Modified Capabilities

- `fumadocs-ui`: The fumadocs-ui package gains a new exported component (`Header`); no existing requirement changes, only additive

## Impact

- `packages/fumadocs-ui/src/components/` — new `header.tsx` file and updated `index.ts` export
- `apps/www/app/layout.config.tsx` — deleted (all nav configuration moves into each layout file directly)
- `apps/www/app/(home)/layout.tsx` and `apps/www/app/docs/layout.tsx` — updated to use the new `Header` component
- No breaking changes to consumers; purely additive
