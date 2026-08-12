---
"@arkenv/fumadocs-ui": patch
---

Fix link underlines when a docs link includes inline code (code-only or mixed with text). Use a continuous `text-decoration` underline so the line runs through plain text and inside the code chip at the same baseline, instead of a `border-bottom` that the chip background covers.
