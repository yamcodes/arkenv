---
"@arkenv/fumadocs-ui": patch
---

#### Flush docs sidebar items with the Site Nav wordmark

Give the drill-in tree equal `--site-nav-gutter` column pads so the active pill is inset the same from both sidebar rails (pill left stays on the helm). Keep `px-2.5` inner padding so glyphs clear the 0.25rem pill radius. Clip the drill-in slide pane (`overflow: clip` plus `overflow-clip-margin: 0.5rem`) so a parked panel cannot leak a highlight sliver onto the outer rail.
