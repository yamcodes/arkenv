---
"@arkenv/fumadocs-ui": patch
---

#### Fix continuous underlines for docs links that include inline code

Links that wrap only a code chip or mix plain text with code now keep one continuous underline through the text and inside the code chip, instead of losing the line under the chip background.

Affected markdown patterns:

```md
[`number.port`](/docs/reference/keywords)

[see the `number.port` keyword](/docs/reference/keywords)
```
