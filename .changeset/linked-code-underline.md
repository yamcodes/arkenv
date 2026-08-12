---
"@arkenv/fumadocs-ui": patch
---

Fix link underlines when the link wraps only an inline code chip (e.g. `` [`number.port`](/docs/...) ``). The chip background no longer clips the underline; the underline is painted under the chip instead.
