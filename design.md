# Design — Arkenv

A locked design system for this app. Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre

atmospheric

## Macrostructure family

Pages within a family share the family's shape; they vary only in component archetypes.

- Marketing pages: Workbench (with terminal setup walkthrough, code examples in framed components)
- App pages:       Workbench
- Content pages:   Long Document

## Theme

- `--color-paper`:   oklch(13% 0.014 225) (deep marine-navy paper)
- `--color-paper-2`: oklch(16% 0.016 225) (slightly lighter marine panel)
- `--color-paper-3`: oklch(20% 0.018 225) (focus terminal pane)
- `--color-ink`:     oklch(94% 0.008 225) (ice-blue tinted white)
- `--color-ink-2`:   oklch(76% 0.010 225) (muted text)
- `--color-rule`:    oklch(24% 0.012 225) (nautical chart/terminal border lines)
- `--color-accent`:  oklch(78% 0.16 210) (electric marine-cyan for prompt markers, links, and highlights)
- `--color-focus`:   oklch(80% 0.20 210) (focus rings)

## Typography

- Display: JetBrains Mono, weight 600, style normal
- Body:    Geist, weight 350 (reduced from 400 for dark mode canvas)
- Mono:    JetBrains Mono, weight 400
- Display tracking: -0.03em
- Type scale anchor: `--text-display` = clamp(2rem, 5vw, 4rem)

## Spacing

4-point named scale. The values are in `tokens.css`. Pages must use named tokens (`var(--space-md)`), never raw values.

## Motion

- Easings: cubic-bezier(0.16, 1, 0.3, 1) named `--ease-out`
- Reveal pattern: fade only (no slide, no bounce)
- Reduced-motion fallback: opacity-only, ≤ 150 ms.

## Microinteractions stance

- silent success (no celebratory toasts, copy-to-clipboard is silent/brief indicator)
- hover delay 800 ms · focus delay 0 ms
- Blink cursor (▮) allowed *only* in prompt/nav `N8` and terminal simulation blocks.

## CTA voice

- Primary CTA: Outlined command container (CLI chip style, e.g. `npx arkenv init` with copy icon).
- Secondary CTA: Monospace typographic link with `var(--color-accent)` hover underline.

## Per-page allowances

- Marketing pages MAY use enrichment (Tier-A CSS terminal animation, SVG sonar charts).
- App pages: no enrichment — function carries the page.
- Content pages: typography only.

## What pages MUST share

- The wordmark / logotype (`arkenv`).
- The accent colour and its placement (≤ 5 % per viewport).
- The display + body fonts.
- The CTA voice (terminal outline buttons or simple text links).
- The default dark background and marine/nautical atmosphere.

## What pages MAY differ on

- Macrostructure within the page-type family (e.g. Bento vs. Workbench, though default is Workbench).
- Hero archetype (within the family's allowance).
- Interactive widget elements.

## Exports

Drop-in formats for re-using this design system in other projects.

### tokens.css

```css
:root {
  --color-paper:      oklch(13% 0.014 225);
  --color-paper-2:    oklch(16% 0.016 225);
  --color-paper-3:    oklch(20% 0.018 225);
  --color-ink:        oklch(94% 0.008 225);
  --color-ink-2:      oklch(76% 0.010 225);
  --color-rule:       oklch(24% 0.012 225);
  --color-accent:     oklch(78% 0.16 210);
  --color-accent-ink: oklch(13% 0.014 225);
  --color-focus:      oklch(80% 0.20 210);

  --font-display: "JetBrains Mono", monospace;
  --font-body:    "Geist", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;

  --space-3xs: 0.25rem;  --space-2xs: 0.5rem;  --space-xs: 0.75rem;
  --space-sm:  1rem;     --space-md:  1.5rem;  --space-lg: 2rem;
  --space-xl:  3rem;     --space-2xl: 4.5rem;  --space-3xl: 7rem;

  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-md: 1.125rem;
  --text-lg: 1.375rem; --text-xl: 1.75rem;  --text-2xl: 2.25rem;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-short: 220ms;
  --radius-card: 4px; --radius-pill: 9999px; --radius-input: 4px;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper:   oklch(13% 0.014 225);
  --color-paper-2: oklch(16% 0.016 225);
  --color-paper-3: oklch(20% 0.018 225);
  --color-ink:     oklch(94% 0.008 225);
  --color-ink-2:   oklch(76% 0.010 225);
  --color-rule:    oklch(24% 0.012 225);
  --color-accent:  oklch(78% 0.16 210);
  --font-display:  "JetBrains Mono", monospace;
  --font-body:     "Geist", sans-serif;
  --font-mono:     "JetBrains Mono", monospace;
  
  --spacing-3xs: 0.25rem;  --spacing-2xs: 0.5rem;  --spacing-xs: 0.75rem;
  --spacing-sm:  1rem;     --spacing-md:  1.5rem;  --spacing-lg: 2rem;
  --spacing-xl:  3rem;     --spacing-2xl: 4.5rem;  --spacing-3xl: 7rem;
  
  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-md: 1.125rem;
  --text-lg: 1.375rem; --text-xl: 1.75rem;  --text-2xl: 2.25rem;
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper":  { "$value": "oklch(13% 0.014 225)", "$type": "color" },
    "paper-2":{ "$value": "oklch(16% 0.016 225)", "$type": "color" },
    "paper-3":{ "$value": "oklch(20% 0.018 225)", "$type": "color" },
    "ink":    { "$value": "oklch(94% 0.008 225)", "$type": "color" },
    "ink-2":  { "$value": "oklch(76% 0.010 225)", "$type": "color" },
    "rule":   { "$value": "oklch(24% 0.012 225)", "$type": "color" },
    "accent": { "$value": "oklch(78% 0.16 210)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "JetBrains Mono", "$type": "fontFamily" },
    "body":    { "$value": "Geist", "$type": "fontFamily" },
    "mono":    { "$value": "JetBrains Mono", "$type": "fontFamily" }
  },
  "space": {
    "3xs": { "$value": "0.25rem", "$type": "dimension" },
    "2xs": { "$value": "0.5rem", "$type": "dimension" },
    "xs":  { "$value": "0.75rem", "$type": "dimension" },
    "sm":  { "$value": "1rem", "$type": "dimension" },
    "md":  { "$value": "1.5rem", "$type": "dimension" },
    "lg":  { "$value": "2rem", "$type": "dimension" },
    "xl":  { "$value": "3rem", "$type": "dimension" },
    "2xl": { "$value": "4.5rem", "$type": "dimension" },
    "3xl": { "$value": "7rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background:        13%  0.014  225;   /* paper */
  --foreground:        94%  0.008  225;   /* ink */
  --card:              16%  0.016  225;   /* paper-2 */
  --card-foreground:   94%  0.008  225;   /* ink */
  --popover:           20%  0.018  225;   /* paper-3 */
  --popover-foreground:94%  0.008  225;   /* ink */
  --primary:           78%  0.16   210;   /* accent */
  --primary-foreground: 13%  0.014  225;   /* accent-ink */
  --muted:             24%  0.012  225;   /* rule */
  --muted-foreground:  76%  0.010  225;   /* ink-2 */
  --border:            24%  0.012  225;   /* rule */
  --input:             24%  0.012  225;   /* rule */
  --ring:              80%  0.20   210;   /* focus */
  --radius:            4px;
}
```
