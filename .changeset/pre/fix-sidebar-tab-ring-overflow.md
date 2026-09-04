---
"@arkenv/fumadocs-ui": patch
---

#### Fix keyboard focus ring truncation in sidebar navigation

The drill-in sidebar slide container now uses `overflow: clip` with an expanded clip margin instead of `overflow: hidden`, preventing keyboard focus rings from being clipped along the left and right edges.
