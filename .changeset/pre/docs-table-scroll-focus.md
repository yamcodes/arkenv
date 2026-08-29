---
"@arkenv/fumadocs-ui": patch
---

#### Make markdown table wrappers keyboard-focusable

Wide docs tables use an `overflow-auto` wrapper. That wrapper is now focusable (`tabIndex={0}`) so axe `scrollable-region-focusable` passes and keyboard users can scroll the region in Safari.
