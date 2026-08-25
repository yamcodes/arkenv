---
"@arkenv/fumadocs-ui": patch
---

#### Match search dialog radius to control boundaries and maintain readable expanded layout

Match the docs search dialog radius to the navbar search control (`--radius-control`, 0.375rem) so the collapsed overlay is no longer a pill, and adjust the expanded search panel radius so `overflow-hidden` does not clip result titles or excerpts.
