# Fumadocs Externalization Plan: `@arkenv/fumadocs-ui-theme`

This document outlines the plan to externalize the UI refinements, components, and logic developed for the Bedstack documentation into a reusable NPM package.

## 1. Package Identity
- **Name**: `@arkenv/fumadocs-ui-theme`
- **Scope**: All visual refinements, custom MDX components, and utility logic.
- **Technology**: React, Tailwind CSS v4, Lucide React, Fumadocs UI.

## 2. Package Structure
```bash
@arkenv/fumadocs-ui-theme/
├── src/
│   ├── components/       # Custom React components
│   ├── styles/           # Global and component-specific CSS
│   ├── utils/            # Shared logic (e.g., URL helpers)
│   ├── index.ts          # Main entry (Components)
│   └── mdx.tsx           # MDX Components mapping
├── package.json          # Subpath exports definition
└── tsconfig.json
```

## 3. Core Implementation (Source Code)

### A. Style System (`src/styles/theme.css`)
This file contains the "Design System" including the sharpened `--radius`, the taller header heights, and the external link icon assets.

```css
@import "tailwindcss";
@import "fumadocs-ui/css/shadcn.css";
@import "fumadocs-ui/css/preset.css";

:root {
  /* Semi-sharp edges for standard UI elements */
  --radius: 0.125rem; 
  
  /* Tall header layout */
  --fd-nav-height: 80px !important;
  --fd-header-height: 80px !important;

  /* External Link Icons (Variables) */
  --icon-external: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='7 7 17 7 17 17'%3E%3C/polyline%3E%3Cline x1='7' y1='17' x2='17' y2='7'%3E%3C/line%3E%3C/svg%3E");
  --icon-external-dark: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='7 7 17 7 17 17'%3E%3C/polyline%3E%3Cline x1='7' y1='17' x2='17' y2='7'%3E%3C/line%3E%3C/svg%3E");
}

@theme inline {
  /* Sync all Tailwind radius tokens to the sharpened 2px base */
  --radius-sm: var(--radius);
  --radius-md: var(--radius);
  --radius-lg: var(--radius);
  --radius-xl: var(--radius);
}

/* --- Core Overrides --- */

/* Sharper Cards, Search Bars, and Popovers */
button[data-search-full], button[data-search], [data-card], .prose .rounded-xl, [role="dialog"], kbd {
  border-radius: 0.125rem !important;
}

/* Documentation Link Underlines */
article a:not(:has(img)):not(.fd-card):not([data-card]):not([class*="fd-"]):not([data-no-underline]),
[data-external-link]:not(:has(img)):not(.fd-card):not([data-card]):not([class*="fd-"]):not([data-no-underline]) {
  text-decoration: none;
  border-bottom: 1.5px solid currentColor;
  padding-bottom: 1px;
  transition: border-bottom-width 0.1s ease;
}

article a:hover, [data-external-link]:hover {
  border-bottom-width: 2.5px;
}

/* External Link Logic (Visual) */
article a[rel*="noopener"][target="_blank"]:not(.fd-card):not([data-card]):not([data-no-arrow]):not(:has(img)),
[data-external-link]:not(.fd-card):not([data-card]):not([data-no-arrow]):not(:has(img)) {
  padding-right: 1.1em;
  background-image: var(--icon-external);
  background-repeat: no-repeat;
  background-size: 0.9em;
  background-position: center right;
}

.dark article a[target="_blank"] {
  background-image: var(--icon-external-dark);
}

/* Sidebar & Nav consistency for external links */
[data-radix-scroll-area-viewport] a[target="_blank"]::after, #nd-nav a[target="_blank"]::after {
  content: "";
  width: 0.9em;
  height: 0.9em;
  margin-left: 0.1em;
  background-image: var(--icon-external);
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.5;
}
```

### B. Logical Utilities (`src/utils/url.ts`)
```typescript
export function isExternalUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('#')) return false;

  try {
    const urlObj = new URL(url, 'http://localhost');
    const hostname = urlObj.hostname.toLowerCase();

    // Treat localhost as internal for dev consistency
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;

    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### C. The `ExternalLink` Component (`src/components/ExternalLink.tsx`)
```tsx
import FumadocsLink from 'fumadocs-core/link';
import { isExternalUrl } from '../utils/url';

export function ExternalLink({ href, children, ...props }) {
  const isExternal = isExternalUrl(href);
  return (
    <FumadocsLink
      href={href}
      data-external-link={isExternal || undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </FumadocsLink>
  );
}
```

### D. Custom Heading with Anchor Fixes (`src/components/Heading.tsx`)
This handles the taller header by providing `scroll-m-32` and adding a hover anchor icon.

```tsx
import { LinkIcon } from 'lucide-react';
import { cn } from '../utils/cn'; // local cn helper

export function Heading({ as: As = 'h2', children, ...props }) {
  if (!props.id) return <As {...props}>{children}</As>;

  return (
    <As className={cn('group relative scroll-m-32 font-bold tracking-tight', props.className)} {...props}>
      <div className="absolute -left-7 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 w-8">
        <a href={`#${props.id}`} className="p-1 rounded-md text-fd-primary">
          <LinkIcon className="size-4" />
        </a>
      </div>
      <a href={`#${props.id}`} className="no-underline text-inherit" data-no-underline>
        {children}
      </a>
    </As>
  );
}
```

### E. AI Actions (`src/components/AIActions.tsx`)
Consolidated `LLMCopyButton` and `ViewOptions` with the sharpened corner overrides.

---

## 4. MDX Wiring (`src/mdx.tsx`)
This allows a single-line integration in `mdx-components.tsx`.

```tsx
import defaultComponents from 'fumadocs-ui/mdx';
import { ExternalLink } from './components/ExternalLink';
import { Heading } from './components/Heading';
import { CodeBlock, Pre } from './components/CodeBlock';

export const arkenvComponents = {
  ...defaultComponents,
  a: ExternalLink,
  h1: (p) => <Heading as="h1" {...p} />,
  h2: (p) => <Heading as="h2" {...p} />,
  h3: (p) => <Heading as="h3" {...p} />,
  pre: (p) => (
      <CodeBlock {...p}>
        <Pre {...p} className="p-0 border-none bg-transparent" />
      </CodeBlock>
  ),
};
```

---

## 5. Usage Concept
In any new Fumadocs project:

1. **Install**: `npm install @arkenv/fumadocs-ui-theme`
2. **Apply Styles** (`global.css`):
   ```css
   @import "@arkenv/fumadocs-ui-theme/css";
   ```
3. **Register Components** (`mdx-components.tsx`):
   ```tsx
   import { arkenvComponents } from '@arkenv/fumadocs-ui-theme/mdx';
   
   export function getMDXComponents(components) {
     return { ...arkenvComponents, ...components };
   }
   ```
