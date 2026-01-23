# @arkenv/fumadocs-ui

A Fumadocs-ready component and theme package for ArkEnv documentation. It ships sharpened Tailwind v4 styling, external link handling, enhanced headings/code blocks, AI actions, and a ready-to-use MDX component map.

## Highlights
- Design system CSS with 0.125rem radius and 80px header/nav height overrides
- External link detection with safe targets and visual indicators
- Anchorable headings with scroll margin for tall headers
- Enhanced code blocks and AI actions (copy markdown, open in AI assistants)
- Preconfigured `arkenvComponents` MDX map that layers our overrides onto `fumadocs-ui` defaults

## Install
Ensure peer dependencies from `fumadocs-ui` are available, then install:

```bash
pnpm add @arkenv/fumadocs-ui
```

## Style entry
Import the theme CSS once (Tailwind v4 style):

```css
/* e.g. apps/www/app/globals.css */
@import "@arkenv/fumadocs-ui/css/theme.css";
```

## MDX components
Use the prebuilt mapping in your MDX provider:

```ts
import { arkenvComponents } from "@arkenv/fumadocs-ui/mdx";

export const mdxComponents = {
	...arkenvComponents,
};
```

## Components
Client components suitable for Next.js App Router:

```tsx
import { AIActions, CodeBlock, ExternalLink, Heading } from "@arkenv/fumadocs-ui/components";

// Example
<Heading as="h2" id="getting-started">Getting started</Heading>
<ExternalLink href="https://arkenv.js.org">Docs</ExternalLink>
```

## Utilities

```ts
import { isExternalUrl, cn } from "@arkenv/fumadocs-ui/utils";
```

## Notes
- Components are client-side and include the required `"use client"` directives in the published bundle.
- CSS overrides Fumadocs defaults; no additional config is needed beyond importing `theme.css`.
