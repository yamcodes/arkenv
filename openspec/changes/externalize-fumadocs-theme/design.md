# Design: externalize-fumadocs-theme

## Architecture
The `@arkenv/fumadocs-ui-theme` package will be a React component library optimized for [Fumadocs](https://fumadocs.dev).

### Package Exports
- `@arkenv/fumadocs-ui-theme`: Component entry point.
- `@arkenv/fumadocs-ui-theme/mdx`: MDX component mapping.
- `@arkenv/fumadocs-ui-theme/css`: Tailwind v4 stylesheet.

### Key Components
1. **Styles**:
   - Uses Tailwind v4 `@import "tailwindcss";`.
   - Defines a sharpened design system (`--radius: 0.125rem`).
   - Overrides Fumadocs header heights to `80px`.
   - Implements "External Link" visual indicators using SVG data URIs.

2. **Heading**:
   - Wraps standard headings with a custom anchor implementation.
   - Includes `scroll-m-32` to account for the taller header.
   - Shows a `LinkIcon` on hover.

3. **ExternalLink**:
   - Extends `FumadocsLink`.
   - Automatically detects external URLs and adds `target="_blank"` and `rel="noopener noreferrer"`.
   - Adds a `data-external-link` attribute for CSS targeting.

4. **MDX Mapping**:
   - Provides a pre-configured `arkenvComponents` object that combines `defaultComponents` with our overrides.

### Directory Structure
```
packages/fumadocs-ui-theme/
├── src/
│   ├── components/       # Heading, ExternalLink, CodeBlock, etc.
│   ├── styles/           # theme.css
│   ├── utils/            # url.ts, cn.ts
│   ├── index.ts          # Exports for components
│   └── mdx.tsx           # Exports arkenvComponents mapping
├── package.json
└── tsconfig.json
```
