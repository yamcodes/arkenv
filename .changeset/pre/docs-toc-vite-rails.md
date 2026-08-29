---
"@arkenv/fumadocs-ui": patch
---

#### Sit the TOC spy on the article rail and align active heading detection

Drop the inner TOC hairline and draw the active heading marker on the column's start border (Vite `left: -1px`), so the ink bar rides the article↔TOC splitter. Select the last heading at or above the Site Nav scroll-margin so a section parked at the top of the page stays active when the next heading is in view.
